import {APIConnectionController} from "./APIConnectionController";
import {SpotifyPlaybackController} from "../playback/SpotifyPlaybackController";
import {Song} from "../../models/Song";
import {PlaybackProvider} from "../../models/PlaybackProvider";
import {SpotifySearch} from "./requests/search/SpotifySearch";
import {YouTubeSearch} from "./requests/search/YouTubeSearch";

export class SearchController {
    constructor(private api: APIConnectionController, private spotify: SpotifyPlaybackController) {
    }

    public async onSpotify(query: string): Promise<Array<Song>> {
        const response = await this.api.requests.request(SpotifySearch(this.spotify.token, query));
        if (response.status === 'success') return response.result;
        throw("An error occurred.");
    }

    public async onYouTube(query: string): Promise<Array<Song>> {
        const response = await this.api.requests.request(YouTubeSearch(query), 6000);
        if (response.status === 'success') return response.result;
        throw("An error occurred.");
    }
}
