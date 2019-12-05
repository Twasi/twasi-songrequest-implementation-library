import {PlaybackProvider} from "./PlaybackProvider";

export interface Song {
    requester: Requester;
    timestamp: number;
    uri: string;
    provider: PlaybackProvider,
    name: string,
    artists: Array<string>,
    covers?: Array<string>,
    duration: number
}

export interface Requester {
    displayName: string;
    userName: string;
    twitchId: string;
    avatar: string;
}
