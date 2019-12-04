import {Song} from "../../models/Song";

export abstract class PlaybackSlaveController {
    public abstract pause(): void;

    public abstract play(song: Song): void;

    public abstract seek(position: number): void;

    public abstract setVolume(volume: number): void;

    public abstract resume(): void;

    constructor(protected events: PlaybackSlaveEvents) {
    }
}

export interface PlaybackSlaveEvents {
    onPlay: (song: Song) => void;
    onPause: () => void;
    onPositionChange: (pos: number, duration: number) => void;
    onNext: () => void;
}
