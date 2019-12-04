import {APIConnectionController} from "../api/APIConnectionController";

declare const Spotify: any;

export class SpotifyPlaybackController {
    private player: any;

    constructor(private api: APIConnectionController) {
    }

    public init(token: string) {
        if (this.player) this.player.disconnect();
        const player = new Spotify.Player({
            name: 'Twasi-Panel',
            getOAuthToken: (cb: (token: string) => void) => {
                cb(token);
            }
        });
        // Error handling
        player.addListener('initialization_error', ({message}: { message: string }) => {
            console.error(message);
        });
        player.addListener('authentication_error', ({message}: { message: string }) => {
            console.error(message);
        });
        player.addListener('account_error', ({message}: { message: string }) => {
            console.error(message);
        });
        player.addListener('playback_error', ({message}: { message: string }) => {
            console.error(message);
        });

        // Playback status updates
        player.addListener('player_state_changed', (state: string) => {
            console.log(state);
        });

        // Ready
        player.addListener('ready', ({device_id}: { device_id: string }) => {
            console.log('Ready with Device ID', device_id);
        });

        // Not Ready
        player.addListener('not_ready', ({device_id}: { device_id: string }) => {
            console.log('Device ID has gone offline', device_id);
        });
        this.player = player;
        player.connect();
    }
}
