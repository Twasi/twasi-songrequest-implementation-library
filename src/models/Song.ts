import {PlaybackProvider} from "./PlaybackProvider";

export interface Song {
    uri: string;
    provider: PlaybackProvider,
    name: string,
    artists: Array<string>,
    covers?: Array<string>,
    duration: number
}
