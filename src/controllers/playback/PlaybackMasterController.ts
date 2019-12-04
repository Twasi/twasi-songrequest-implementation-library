import {SpotifyPlaybackController} from "./SpotifyPlaybackController";
import {YoutTubePlaybackController} from "./YoutTubePlaybackController";
import {APIConnectionController} from "../api/APIConnectionController";

export class PlaybackMasterController {
    public readonly spotify: SpotifyPlaybackController;
    public readonly youtube: YoutTubePlaybackController;

    constructor(private api: APIConnectionController) {
        this.spotify = new SpotifyPlaybackController(api);
        this.youtube = new YoutTubePlaybackController();
    }
}

export abstract class PlaybackSlaveController {

}
