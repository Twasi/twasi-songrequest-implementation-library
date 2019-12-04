import {SpotifyPlaybackController} from "./SpotifyPlaybackController";
import {YoutTubePlaybackController} from "./YoutTubePlaybackController";
import {APIConnectionController} from "../api/APIConnectionController";
import {Song} from "../../models/Song";
import {Provider} from "../../models/Provider";
import {PlaybackSlaveController} from "./PlaybackSlaveController";
import {TSRIEvents} from "../../models/Events";

export class PlaybackMasterController {
    private song: Song = null;

    private posPredicter: PositionPredicter;

    public readonly spotify: SpotifyPlaybackController;
    public readonly youtube: YoutTubePlaybackController;

    constructor(private api: APIConnectionController, private frontendEvents: TSRIEvents) {
        this.posPredicter = new PositionPredicter(frontendEvents.position);
        this.spotify = new SpotifyPlaybackController({
            onPause: () => {
                if (this.song.provider !== Provider.SPOTIFY) return;
                this.posPredicter.predict = false;
                this.frontendEvents.stop();
            }, onPlay: () => {
                if (this.song.provider !== Provider.SPOTIFY) {
                    this.spotify.pause();
                    return;
                }
                this.posPredicter.predict = true;
                this.frontendEvents.play();
            }, onPositionChange: (p1: number, p2: number) => {
                if (this.song.provider !== Provider.SPOTIFY) return;
                this.posPredicter.setPosition(p1, p2);
            }
        }, api);
        this.youtube = new YoutTubePlaybackController(null);
    }

    public play(song: Song) {
        if (this.song) this.getSlaveControllerByProvider(this.song.provider).pause();
        this.song = song;
        this.getSlaveControllerByProvider(song.provider).play(song);
    }

    public pause() {
        if(this.song) this.getSlaveControllerByProvider(this.song.provider).pause();
    }

    private getSlaveControllerByProvider(provider: Provider): PlaybackSlaveController {
        switch (provider) {
            case Provider.NONE:
            default:
                return null;
            case Provider.SPOTIFY:
                return this.spotify;
            case Provider.YOUTUBE:
                return this.youtube;
        }
    }
}

class PositionPredicter {
    public predict: boolean = false;
    private lastPosition: number = Date.now();
    private duration: number = 0;
    private position: number = 0;
    public prediction: number = 0;

    constructor(callback: (position: number) => void) {
        const predict = () => {
            if (this.predict) this.prediction = (this.position + (Date.now() - this.lastPosition)) / this.duration;
            callback(this.prediction);
            setTimeout(predict, 500);
        };
        predict();
    }

    public setPosition(position: number, duration: number) {
        this.lastPosition = Date.now();
        this.position = position;
        this.duration = duration;
    }
}
