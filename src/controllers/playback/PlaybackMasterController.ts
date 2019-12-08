import {SpotifyPlaybackController} from "./SpotifyPlaybackController";
import {YoutTubePlaybackController} from "./YoutTubePlaybackController";
import {APIConnectionController} from "../api/APIConnectionController";
import {Song} from "../../models/Song";
import {PlaybackProvider} from "../../models/PlaybackProvider";
import {PlaybackSlaveController, PlaybackSlaveEvents} from "./PlaybackSlaveController";
import {TSRIEvents} from "../../models/Events";
import {InitializationStatus} from "../../models/InitializationStatus";
import {BackRequest} from "../api/requests/songrequests/BackRequest";
import {NextRequest} from "../api/requests/songrequests/NextRequest";

export class PlaybackMasterController {
    private song: Song = null;
    private queue: Array<Song> = [];

    private posPredicter: PositionPredicter;

    public readonly spotify: SpotifyPlaybackController;
    public readonly youtube: YoutTubePlaybackController;

    constructor(private api: APIConnectionController, private frontendEvents: TSRIEvents, status: InitializationStatus) {
        this.posPredicter = new PositionPredicter(frontendEvents.position);
        this.spotify = new SpotifyPlaybackController(this.playbackProviderEvents(PlaybackProvider.SPOTIFY), api);
        this.youtube = new YoutTubePlaybackController(this.playbackProviderEvents(PlaybackProvider.YOUTUBE), api, status.youtubeApi);
    }

    public async play(song?: Song) {
        if (song) {
            if (this.song) this.pause();
            this.song = song;
            this.getController(song.provider).play(song);
        } else if (this.song) this.getController(this.song.provider).resume();
        else await this.apiNext();
        this.frontendEvents.song(this.song);
    }

    public pause() {
        if (this.song) this.getController(this.song.provider).pause();
    }

    private getController(provider: PlaybackProvider): PlaybackSlaveController {
        switch (provider) {
            case PlaybackProvider.NONE:
            default:
                return null;
            case PlaybackProvider.SPOTIFY:
                return this.spotify;
            case PlaybackProvider.YOUTUBE:
                return this.youtube;
        }
    }

    public seek(position: number) {
        if (this.song) this.getController(this.song.provider).seek(position);
    }

    public add(song: Song) {
        this.queue.push(song);
        this.frontendEvents.queueUpdate(this.queue);
        if (!this.posPredicter.predict) this.play();
    }

    public setQueue(queue: Array<Song>) {
        if (queue.length) {
            const song = queue[0];
            if (!this.song || this.song.uri !== song.uri) this.play(song);
            else if (this.song.uri === song.uri) queue.shift();
        } else {
            this.frontendEvents.song(null);
        }
        this.queue = queue;
        this.frontendEvents.queueUpdate(this.queue);
    }

    public next() {
        this.posPredicter.resetPosition();
        if (this.song) this.pause();
        if (!this.queue.length) {
            this.song = null;
            this.frontendEvents.song(null);
            this.posPredicter.resetPosition();
        } else {
            this.play(this.queue[0]);
            this.queue.shift();
        }
        this.frontendEvents.queueUpdate(this.queue);
    }

    public async back() {
        let result = await this.api.requests.request(BackRequest);
        if (result.status !== 'success')
            throw (result.message);
    }

    public async apiNext() {
        await this.api.requests.request(NextRequest(false));
    }

    public async skip() {
        await this.api.requests.request(NextRequest(true));
    }

    private playbackProviderEvents(self: PlaybackProvider): PlaybackSlaveEvents {
        return {
            onPause: () => {
                if (!this.song || [PlaybackProvider.NONE, self].includes(this.song.provider)) {
                    this.posPredicter.predict = false;
                    this.frontendEvents.stop();
                }
            }, onPlay: (song?: Song) => {
                if (!this.song) return;
                if (this.song.provider !== self) return;
                this.posPredicter.predict = true;
                this.frontendEvents.play();
            }, onPositionChange: (p1: number, p2: number) => {
                if (!this.song) return;
                if (this.song.provider !== self) return;
                this.posPredicter.setPosition(p1, p2);
            }, onNext: () => this.apiNext()
        };
    }
}

class PositionPredicter {
    public predict: boolean = false;
    private lastPosition: number = Date.now();
    private duration: number = 0;
    private position: number = 0;
    public prediction: number = 0;

    constructor(private callback: (position: number) => void) {
        const predict = () => {
            this.predictNow();
            setTimeout(predict, 500);
        };
        predict();
    }

    public setPosition(position: number, duration: number) {
        this.lastPosition = Date.now();
        this.position = position;
        this.duration = duration;
        this.predictNow();
    }

    public resetPosition() {
        this.setPosition(0, 0);
    }

    private predictNow() {
        let prediction;
        if(this.duration === 0 && this.position === 0) {
            this.callback(0);
            return;
        }
        if (this.predict) prediction = (this.position + (Date.now() - this.lastPosition)) / this.duration;
        if (typeof prediction === "number") this.prediction = prediction > 1 ? 1 : prediction;
        this.callback(this.prediction);
    }
}
