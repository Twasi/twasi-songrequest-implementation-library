import {Song} from "./Song";
import {InitializationStatus} from "./InitializationStatus";
import {Settings} from "./Settings";

export interface TSRIEvents {
    play: () => void,
    pause: () => void,
    stop: () => void,
    initialized: (status: InitializationStatus) => void,
    position: (newPosition: number) => void,
    song: (song: Song) => void,
    enableSpotifyAuth: (enable: boolean) => void
    queueUpdate: (queue: Array<Song>, history: Array<Song>) => void;
    settingsUpdate: (settings: Settings) => void;
}
