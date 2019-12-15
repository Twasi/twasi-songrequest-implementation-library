import {APIConnectionController} from "../api/APIConnectionController";
import {Song} from "../../models/Song";
import {PlaybackSlaveController, PlaybackSlaveEvents} from "./PlaybackSlaveController";
import {TSRIWindow} from "../../models/TSRIWindow";
import {SetVolumeRequest} from "../api/requests/other/SetVolumeRequest";
import {PreviewSong} from "./playbackpreview/PlaybackPreviewController";
import {sleep} from "../../TSRI";

declare const Spotify: any;

export class SpotifyPlaybackController extends PlaybackSlaveController {
    private player: any;
    private song: Song;
    private id: string;
    token: string;
    private playing: boolean = false;
    private volume: number;

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
            this.playing = !state.paused;
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
        player.addListener('ready', async ({device_id}: { device_id: string }) => {
            this.id = device_id;
            await this.setSpotifyPlayerVolume();
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

    async play(song: Song, forceBegin: boolean, start?: number): Promise<void> {
        if (this.song && this.song.uri === song.uri) {
            this.player.resume();
        } else {
            this.song = song;
            const body: any = {uris: [song.uri]};
            if (forceBegin) body.position_ms = 0;
            else if (start) body.position_ms = start;
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
            });
        }
    }

    private async setSpotifyPlayerVolume() {
        return await this.api.requests.request(SetVolumeRequest(this.volume, this.id, this.token));
    }

    seek(position: number): void {
        this.player.seek(this.song.duration * position);
    }

    async setVolume(volume: number, volumeBalance: number): Promise<void> {
        volumeBalance -= .5;
        volumeBalance *= -2;
        volume = volume / 10 * 5;
        volume += (volume + .5) * volumeBalance * .5;
        if (volume < 0) volume = 0;
        this.volume = volume;
        try {
            this.player.setVolume(volume);
            this.setSpotifyPlayerVolume();
        } catch (e) {
            console.log(e);
        }
    }

    resume(): void {
        this.player.resume();
    }

    async preview(song: PreviewSong) {
        // @ts-ignore
        await this.play({uri: song.song.spotify}, false, song.startAt.spotify);
        await sleep(song.duration);
        await this.pause();
    }
}
