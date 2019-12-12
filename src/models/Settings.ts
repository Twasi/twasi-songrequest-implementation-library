export interface Settings {
    maxRequests?: MaxRequests;
    volume?: number;
    volumeBalance?: number;
    maxDuration?: number;
}

export interface MaxRequests {
    BROADCASTER?: number;
    MODERATOR?: number;
    SUBSCRIBER?: number;
    VIEWER?: number;
}
