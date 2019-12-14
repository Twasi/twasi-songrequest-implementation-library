import {PlaybackProvider} from "./PlaybackProvider";

export interface Song {
    requester: Requester;
    timestamp: number;
    uri: string;
    url: string;
    provider: PlaybackProvider,
    name: string,
    artists: Array<string>,
    covers?: Array<string>,
    duration: number,
    playInformation?: PlayInformation
}

export interface Requester {
    displayName: string;
    userName: string;
    twitchId: string;
    avatar: string;
}

export interface PlayInformation {
    played: number;
    skipped: number;
}
