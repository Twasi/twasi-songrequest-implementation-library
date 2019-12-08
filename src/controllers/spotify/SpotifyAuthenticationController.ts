import {APIConnectionController} from "../api/APIConnectionController";
import {GetRequest} from "../api/requests/spotify-credentials/GetRequest";
import {InitRequest} from "../api/requests/spotify-credentials/InitRequest";
import {SetRequest} from "../api/requests/spotify-credentials/SetRequest";
import {RefreshRequest} from "../api/requests/spotify-credentials/RefreshRequest";
import {RemoveRequest} from "../api/requests/spotify-credentials/RemoveRequest";

export class SpotifyAuthenticationController {
    private readonly api: APIConnectionController;
    private readonly listener: ISpotifyAuthenticationListener;

    private token: string = null;
    private expires: Date = null;
    private win: Window;

    constructor(api: APIConnectionController, listener: ISpotifyAuthenticationListener) {
        this.api = api;
        this.listener = listener;
        const receiveCode = async (event: MessageEvent) => {
            if (!(typeof event.data === "string")) return;
            if (!(event.data as string).startsWith("code:")) return;
            await this.set(event.data.substr("code:".length));
            this.win.postMessage("close", "*");
        };
        window.addEventListener("message", receiveCode, false);
    }

    public async get() {
        const res = await this.api.requests.request(GetRequest);
        this.handle(res.token ? res : null);
    }

    public async init() {
        const res = await this.api.requests.request(InitRequest);
        this.win = window.open(res.result.uri, "popUpWindow", 'height=500,width=400,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
    }

    private async set(code: string) {
        const res = await this.api.requests.request(SetRequest(code));
        this.handle(res);
    }

    public async refresh() {
        const res = await this.api.requests.request(RefreshRequest);
        this.handle(res.token ? res : null);
    }

    public async remove() {
        if ((await this.api.requests.request(RemoveRequest)).status !== 'success')
            throw("An error occured");
    }

    private handle(res: { token: string, expires: number } | null) {
        if (!res) this.listener.spotifyAuthenticated(false);
        else {
            this.token = res.token;
            this.expires = new Date(res.expires);
            this.listener.spotifyAuthenticated(true, res.token);
            setTimeout(async () => {
                if (this.token !== res.token) return;
                await this.refresh();
            }, this.expires.getTime() - Date.now());
        }
    }
}

export interface ISpotifyAuthenticationListener {
    statusChanged: (newStatus: boolean) => void,
    spotifyAuthenticated: (authenticated: boolean, token?: string) => void
}
