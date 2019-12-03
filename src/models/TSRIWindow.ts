import {TSRIController} from "../controllers/TSRIController";

export interface TSRIWindow extends Window {
    TSRI?: TSRIController,
    onSpotifyWebPlaybackSDKReady?: () => void
}
