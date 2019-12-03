import {TSRIEvents} from "./Events";
import {InitializationStatus} from "./InitializationStatus";
import {APIConnection} from "./APIConnection";
import {Song} from "./Song";

export class TSRIController {
    public events: TSRIEvents = defaultEvents;
    private status: InitializationStatus = {api: false, spotify: false, youtube: false};
    private api: APIConnection;

    public init(jwt: string, api: string, events: TSRIEvents = null) {
        if(events) this.events = events;
        this.api = new APIConnection(api, jwt, {
            statusChanged: status => {
                this.status.api = status === 0;
                this.events.initialized(this.status);
            }
        });
        this.events.initialized(this.status);
    }

    public spotifyStatus(status: boolean) {
        this.status.spotify = status;
        this.events.initialized(this.status);
    }

    public youtubeStatus(status: boolean) {
        this.status.youtube = status;
        this.events.initialized(this.status);
    }

}

const defaultEvents: TSRIEvents = {
    initialized: function (p1: InitializationStatus) {
        console.log("STATUS: " + p1)
    }, pause: function () {
        console.log("PAUSE");
    }, play: function () {
        console.log("PLAY")
    }, position: function (p1: number) {
        console.log("POS: " + p1)
    }, song: function (p1: Song) {
        console.log("SONG: " + p1)
    }, stop: function () {
        console.log("STOP")
    }, volume: function (p1: number) {
        console.log("VOLUME: " + p1)
    }
};
