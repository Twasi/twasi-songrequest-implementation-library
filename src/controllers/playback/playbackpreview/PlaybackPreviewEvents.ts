import {Song} from "../../../models/Song";
import {PlaybackProvider} from "../../../models/PlaybackProvider";

export interface PlaybackPreviewEvents {
    canPlay: (can: boolean) => void,
    song: (song: Song | null, provider?: PlaybackProvider) => void,
}
