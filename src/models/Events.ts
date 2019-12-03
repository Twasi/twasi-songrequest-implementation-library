import {Song} from "./Song";
import {InitializationStatus} from "./InitializationStatus";

export interface TSRIEvents {
    play: () => void,
    pause: () => void,
    stop: () => void,
    initialized: (status: InitializationStatus) => void,
    volume: (newVolume: number) => void,
    position: (newPosition: number) => void,
    song: (song: Song) => void
}