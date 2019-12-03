import {IAPIRequest} from "../../APIConnectionController";

export const RefreshRequest: IAPIRequest = {
    topic: "twasi-songrequests/spotify-credentials",
    scope: "action",
    action: {
        type: "refresh"
    }
};
