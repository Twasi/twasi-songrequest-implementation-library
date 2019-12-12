import {TSRIEvents} from "../models/Events";
import {InitializationStatus} from "../models/InitializationStatus";
import {APIConnectionController, APIConnectionStatus} from "./api/APIConnectionController";
import {Song} from "../models/Song";
import {SpotifyAuthenticationController} from "./spotify/SpotifyAuthenticationController";
import {PlaybackMasterController} from "./playback/PlaybackMasterController";
import {SearchController} from "./api/SearchController";
import {ReportRequest} from "./api/requests/other/ReportRequest";
import {Settings} from "../models/Settings";

export class TSRIController {
    private status: InitializationStatus = defaultStatus;
    private API: APIConnectionController;
    private spotifyAuth: SpotifyAuthenticationController;
    private playback: PlaybackMasterController;
    private events: TSRIEvents;
    private search: SearchController;
    public reports: any = {spotifyReports: []};
    private authenticated: boolean = false;

    public init(jwt: string, api: string, events: TSRIEvents) {
        this.events = events;
        if (this.API) {
            this.playback.setEvents(events);
            events.enableSpotifyAuth(!this.authenticated);
            events.initialized(this.status);
            return;
        }
        this.API = new APIConnectionController(api, jwt, {
            statusChanged: async status => {
                this.status.api = status === 0;
                this.e().initialized(this.status);
                if (this.status.api) await this.spotifyAuth.get();
                if (status === APIConnectionStatus.CONNECTED) {
                    this.loadQueue(false);
                    await this.playback.setSettings();
                }
            }
        });
        this.playback = new PlaybackMasterController(this.API, this.events, this.status);
        this.search = new SearchController(this.API, this.playback.spotify);
        this.spotifyAuth = new SpotifyAuthenticationController(this.API, {
            statusChanged: this.spotifyStatus,
            spotifyAuthenticated: (authenticated: boolean, token?: string) => {
                this.authenticated = authenticated;
                this.e().enableSpotifyAuth(!authenticated);
                if (token) this.playback.spotify.init(token);
            }
        });
        this.e().initialized(this.status);
    }

    public spotifyStatus(status: boolean) {
        this.status.spotify = status;
        this.e().initialized(this.status);
    }

    public youtubeApiReady() {
        this.status.youtubeApi = true;
        this.e().initialized(this.status);
    }

    public spotifyApiReady() {
        this.status.spotifyApi = true;
        this.e().initialized(this.status);
    }

    private e() {
        if (this.events) return this.events;
        return defaultEvents;
    }

    private async loadQueue(play: boolean = true) {
        await this.playback.loadQueue(play);
    }

    public async report(reason: string) {
        this.reports.reason = reason;
        await this.API.requests.request(ReportRequest(this.reports));
    }
}

const defaultEvents: TSRIEvents = {
    settingsUpdate: function (p1: Settings) {
    },
    queueUpdate: function (p1: Array<Song>) {
    },
    enableSpotifyAuth: function (p1: boolean) {
        console.log("Spotify Authentication is now %s.", (p1 ? "enabled" : "disabled"));
    },
    initialized: function (p1: InitializationStatus) {
    }, pause: function () {
        console.log("PAUSE");
    }, play: function () {
        console.log("PLAY")
    }, position: function (p1: number) {
        console.log("POS: " + p1)
    }, song: function (p1: Song) {
        console.log("SONG: " + p1.name)
    }, stop: function () {
        console.log("STOP")
    }
};

const defaultStatus = {
    api: false,
    spotifyApi: false,
    spotify: false,
    youtubeApi: false,
    youtube: false,
};
