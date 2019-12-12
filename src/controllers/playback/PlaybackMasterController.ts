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
import {GetQueueRequest} from "../api/requests/songrequests/GetQueueRequest";
import {AddRequest} from "../api/requests/songrequests/AddRequest";
import {Settings} from "../../models/Settings";

export class PlaybackMasterController {
    private song: Song = null;
    private queue: Array<Song> = [];
    private _history: Array<Song> = [];
    private firstPlayback: boolean = true;

    private posPredicter: PositionPredicter;

    public readonly spotify: SpotifyPlaybackController;
    public readonly youtube: YoutTubePlaybackController;
    private shouldPlay: boolean = false;
    private settings: Settings;

    constructor(private api: APIConnectionController, private frontendEvents: TSRIEvents, status: InitializationStatus) {
        this.posPredicter = new PositionPredicter(pos => this.frontendEvents.position(pos));
        this.spotify = new SpotifyPlaybackController(this.playbackProviderEvents(PlaybackProvider.SPOTIFY), api);
        this.youtube = new YoutTubePlaybackController(this.playbackProviderEvents(PlaybackProvider.YOUTUBE), api, status.youtubeApi);
        api.on("queue", (queueUpdate) => this.setQueue(queueUpdate.queue, queueUpdate.history, this.shouldPlay));
        api.on("settings", (settings) => {
            this.settings = settings;
        });
    }

    public setEvents(events: TSRIEvents) {
        this.frontendEvents = events;
        if (this.shouldPlay) events.play();
        else events.pause();
        let tempQueue = [...this.queue];
        events.queueUpdate(tempQueue, this._history);
        events.song(this.song);
        events.settingsUpdate(this.settings);
    }

    public async play(forceBegin: boolean, song?: Song) {
        this.shouldPlay = true;
        if (song) {
            if (this.song) this.pause();
            this.song = song;
            this.getController(song.provider).play(song, forceBegin);
        } else if (this.song) {
            if (!this.firstPlayback && this.posPredicter.prediction !== 0)
                this.getController(this.song.provider).resume();
            else {
                this.firstPlayback = false;
                this.play(true, this.song);
            }
        } else await this.next();
        this.frontendEvents.song(this.song);
        this.shouldPlay = true;
    }

    public pause() {
        this.shouldPlay = true;
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

    public localAdd(song: Song) {
        this.queue.push(song);
        this.frontendEvents.queueUpdate(this.queue, this._history);
        if (!this.posPredicter.predict) this.play(false, undefined);
    }

    public setQueue(queue: Array<Song>, history: Array<Song>, play: boolean = true) {
        if (queue.length) {
            const song = queue[0];
            if (play && (!this.song || (this.song && this.song.uri !== song.uri))) this.play(true, song);
            else {
                this.frontendEvents.song(queue[0]);
                this.song = song;
            }
        } else {
            this.posPredicter.resetPosition();
            if (this.song) this.pause();
            this.song = null;
            this.frontendEvents.song(null);
            this.posPredicter.resetPosition();
        }
        this.queue = queue;
        this._history = history;
        this.frontendEvents.queueUpdate(this.queue, this._history);
    }

    public localNext() {
        this.posPredicter.resetPosition();
        if (this.song) {
            this.pause();
            this._history.unshift(this.song);
        }
        if (!this.queue.length) {
            this.song = null;
            this.frontendEvents.song(null);
            this.posPredicter.resetPosition();
        } else {
            this.play(true, this.queue[0]);
            this.queue.shift();
        }
        this.frontendEvents.queueUpdate(this.queue, this._history);
    }

    public async back() {
        let result = await this.api.requests.request(BackRequest);
        if (result.status !== 'success')
            throw (result.message);
    }

    public async next() {
        await this.api.requests.request(NextRequest(false));
    }

    public async skip() {
        await this.api.requests.request(NextRequest(true));
    }

    public async apiAdd(song: Song) {
        await this.api.requests.request(AddRequest(song));
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
            }, onNext: () => this.next()
        };
    }

    public async loadQueue(play: boolean = true) {
        let result = (await this.api.requests.request(GetQueueRequest)).result;
        this.setQueue(result.queue, result.history, play);
    }

    public async setVolume() {

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
        if (this.duration === 0 && this.position === 0) {
            this.callback(0);
            return;
        }
        if (this.predict) prediction = (this.position + (Date.now() - this.lastPosition)) / this.duration;
        if (typeof prediction === "number") this.prediction = prediction > 1 ? 1 : prediction;
        this.callback(this.prediction);
    }
}
