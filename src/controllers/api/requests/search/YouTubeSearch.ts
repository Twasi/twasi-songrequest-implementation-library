import {IAPIRequest} from "../../APIConnectionController";
import {PlaybackProvider} from "../../../../models/PlaybackProvider";

export const YouTubeSearch = (query: string): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: "search",
            provider: PlaybackProvider.YOUTUBE,
            query
        }
    }
};
