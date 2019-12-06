import {IAPIRequest} from "../../APIConnectionController";
import {PlaybackProvider} from "../../../../models/PlaybackProvider";

export const SpotifySearch = (token: string, query: string): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: "search",
            provider: PlaybackProvider.SPOTIFY,
            token,
            query
        }
    }
};
