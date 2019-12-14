import {PlaybackSlaveController, PlaybackSlaveEvents} from "./PlaybackSlaveController";
import {Song} from "../../models/Song";
import {APIConnectionController} from "../api/APIConnectionController";

export class YouTubePlaybackController extends PlaybackSlaveController {
    public readonly player: any;

    constructor(events: PlaybackSlaveEvents, api: APIConnectionController, youtubeApi: boolean) {
        super(events);
        if (!youtubeApi) throw ("API_NOT_READY");
        // @ts-ignore
        this.player = new YT.Player('youtube-player', {
            events: {
                onStateChange: (event: any) => this.onUpdate(event)
            }
        });
        const permaUpdate = () => {
            this.setPos();
            setTimeout(permaUpdate, 500);
        };
        permaUpdate();
    }

    private setPos() {
        try {
            this.events.onPositionChange(this.player.getCurrentTime() * 1000, this.player.getDuration() * 1000);
        } catch (e) {
        }
    }

    private onUpdate(event: any) {
        if (event.data === 1) this.events.onPlay();
        else if (event.data === 0) this.events.onNext();
        else this.events.onPause();
        this.setPos();
    }


    pause(): void {
        this.player.pauseVideo();
    }

    play(song: Song, forceBegin: boolean): void {
        this.player.loadVideoById(song.uri);
    }

    seek(position: number): void {
        this.player.seekTo(this.player.getDuration() * position);
    }

    setVolume(volume: number, volumeBalance: number): void {
        volumeBalance -= .5;
        volumeBalance *= 2;
        volume = volume / 10 * 5;
        volume += (volume + .5) * volumeBalance * .5;
        if (volume < 0) volume = 0;
        try {
            this.player.setVolume(volume * 100);
        } catch (e) {
        }
    }

    resume(): void {
        this.player.playVideo();
    }

}
