import {Song} from "../../../models/Song";
import {PlaybackProvider} from "../../../models/PlaybackProvider";
import {PreviewSong} from "./PlaybackPreviewController";

export interface PlaybackPreviewEvents {
    canPlay: (can: boolean) => void,
    song: (song: PreviewSong, provider?: PlaybackProvider) => void,
}
