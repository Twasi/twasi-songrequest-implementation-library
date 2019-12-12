import {APIConnectionController} from "../api/APIConnectionController";
import {Song} from "../../models/Song";
import {PlaybackSlaveController, PlaybackSlaveEvents} from "./PlaybackSlaveController";
import {TSRIWindow} from "../../models/TSRIWindow";

declare const Spotify: any;

export class SpotifyPlaybackController extends PlaybackSlaveController {
    private player: any;
    private song: Song;
    private id: string;
    token: string;

    constructor(protected events: PlaybackSlaveEvents, private api: APIConnectionController) {
        super(events);
    }

    public init(token: string) {
        if (this.player) this.player.disconnect();
        this.token = token;
        const player = new Spotify.Player({
            name: 'Twasi-Panel',
            getOAuthToken: (cb: (token: string) => void) => {
                cb(token);
            }
        });
        // Error handling
        player.addListener('initialization_error', ({message}: { message: string }) => {
            (window as TSRIWindow).TSRI.reports.spotifyReports.push({type: 'initialization_error', message});
        });
        player.addListener('authentication_error', async ({message}: { message: string }) => {
            (window as TSRIWindow).TSRI.reports.spotifyReports.push({type: 'authentication_error', message});
        });
        player.addListener('account_error', async ({message}: { message: string }) => {
            (window as TSRIWindow).TSRI.reports.spotifyReports.push({type: 'account_error', message});
        });
        player.addListener('playback_error', async ({message}: { message: string }) => {
            (window as TSRIWindow).TSRI.reports.spotifyReports.push({type: 'playback_error', message});
        });

        // Playback status updates
        player.addListener('player_state_changed', async (state: any) => {
            if (!state) return;
            if (state.position && state.duration)
                this.events.onPositionChange(state.position, state.duration);
            else if (!state.paused)
                this.events.onPositionChange(0, this.song.duration);
            if (state.paused)
                this.events.onPause();
            else this.events.onPlay(this.song);
            if (
                state.paused && state.disallows.resuming
                && state.position && state.duration
                && (state.position / state.duration > 0.98)
            ) this.events.onNext();
        });

        // Ready
        player.addListener('ready', ({device_id}: { device_id: string }) => {
            this.id = device_id;
        });

        // Not Ready
        player.addListener('not_ready', async ({device_id}: { device_id: string }) => {
            // @ts-ignore
            await (window as TSRIWindow).TSRI.spotifyAuth.refresh();
        });
        this.player = player;
        player.connect();
    }

    pause(): void {
        this.player.pause();
    }

    async play(song: Song, forceBegin: boolean): Promise<void> {
        if (this.song && this.song.uri === song.uri) {
            this.player.resume();
        } else {
            this.song = song;
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.id}`, {
                method: 'PUT',
                body: JSON.stringify({uris: [song.uri]}),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
            });
        }
    }

    seek(position: number): void {
        this.player.seek(this.song.duration * position);
    }

    setVolume(volume: number, volumeBalance: number): void {
        volumeBalance -= .5;
        volumeBalance *= -2;
        volume = volume / 10 * 7.5;
        volume += volumeBalance * .25;
        this.player.setVolume(volume);
    }

    resume(): void {
        this.player.resume();
    }

}
