import {TSRIEvents} from "../models/Events";
import {InitializationStatus} from "../models/InitializationStatus";
import {APIConnectionController} from "./api/APIConnectionController";
import {Song} from "../models/Song";
import {SpotifyAuthenticationController} from "./spotify/SpotifyAuthenticationController";
import {PlaybackMasterController} from "./playback/PlaybackMasterController";

export class TSRIController {
    private status: InitializationStatus = defaultStatus;
    private API: APIConnectionController;
    private spotifyAuth: SpotifyAuthenticationController;
    private playback: PlaybackMasterController;
    private events: TSRIEvents;

    public init(jwt: string, api: string, events: TSRIEvents) {
        this.events = events;
        this.API = new APIConnectionController(api, jwt, {
            statusChanged: async status => {
                this.status.api = status === 0;
                this.e().initialized(this.status);
                if (this.status.api) await this.spotifyAuth.get();
            }
        });
        this.playback = new PlaybackMasterController(this.API, events);
        this.spotifyAuth = new SpotifyAuthenticationController(this.API, {
            statusChanged: this.spotifyStatus,
            spotifyAuthenticated: (authenticated: boolean, token?: string) => {
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

    public youtubeStatus(status: boolean) {
        this.status.youtube = status;
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
}

const defaultEvents: TSRIEvents = {
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
    }, volume: function (p1: number) {
        console.log("VOLUME: " + p1)
    }
};

const defaultStatus = {
    api: false,
    spotifyApi: false,
    spotify: false,
    youtube: false
};
