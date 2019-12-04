import {APIConnectionController} from "../api/APIConnectionController";
import {Song} from "../../models/Song";
import {PlaybackSlaveController, PlaybackSlaveEvents} from "./PlaybackSlaveController";
import {TSRIWindow} from "../../models/TSRIWindow";

declare const Spotify: any;

export class SpotifyPlaybackController extends PlaybackSlaveController {
    private player: any;
    private song: Song;
    private id: string;
    private token: string;

    constructor(protected events: PlaybackSlaveEvents, private api: APIConnectionController) {
        super(events);
        const permaUpdate = async () => {
            await this.positionUpdate();
            setTimeout(permaUpdate, 5000);
        };
        permaUpdate().then();
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
            player.disconnect();
        });
        player.addListener('authentication_error', async ({message}: { message: string }) => {
            player.disconnect();
            // @ts-ignore
            await (window as TSRIWindow).TSRI.spotifyAuth.init();
        });
        player.addListener('account_error', async ({message}: { message: string }) => {
            // @ts-ignore
            await (window as TSRIWindow).TSRI.spotifyAuth.refresh();
        });
        player.addListener('playback_error', async ({message}: { message: string }) => {
            // @ts-ignore
            await (window as TSRIWindow).TSRI.spotifyAuth.refresh();
        });

        // Playback status updates
        player.addListener('player_state_changed', async (state: any) => {
            if (!state) return;
            if (state.position && state.duration)
                this.events.onPositionChange(state.position, state.duration);
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

    async play(song: Song): Promise<void> {
        if (this.song && this.song.uri === song.uri) {
            this.player.resume();
            return;
        }
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

    seek(position: number): void {
        this.player.seek(this.song.duration * position);
    }

    setVolume(volume: number): void {
        this.player.setVolume(volume);
    }

    resume(): void {
        this.player.resume();
    }

    private async positionUpdate() {
        try {
            let state = await this.player.getCurrentState();
            if (state) this.events.onPositionChange(state.position, state.duration);
        } catch (e) {
        }
    }
}

