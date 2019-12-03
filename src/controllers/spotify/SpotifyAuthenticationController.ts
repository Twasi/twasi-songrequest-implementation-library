import {APIConnectionController} from "../api/APIConnectionController";
import {GetRequest} from "../api/requests/spotify-credentials/GetRequest";

export class SpotifyAuthenticationController {
    private readonly api: APIConnectionController;
    private readonly listener: ISpotifyAuthenticationListener;

    private check: boolean = false;

    private token: string = null;
    private expires: Date = null;

    constructor(api: APIConnectionController, listener: ISpotifyAuthenticationListener) {
        this.api = api;
        this.listener = listener;
    }

    public async get() {
        const e = await this.api.requests.request(GetRequest);
        if (e.status === "success") {
            this.token = e.token;
            this.expires = new Date(e.expires);
            console.log({token: this.token, expires: this.expires});
            this.listener.spotifyAuthenticated(true);
        }
        this.listener.spotifyAuthenticated(false);
    }

    public async init() {

    }
}

export interface ISpotifyAuthenticationListener {
    statusChanged: (newStatus: boolean) => void,
    spotifyAuthenticated: (authenticated: boolean) => void
}
