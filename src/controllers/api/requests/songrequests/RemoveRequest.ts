import {IAPIRequest} from "../../APIConnectionController";

export const RemoveRequest: IAPIRequest = {
    topic: "twasi-songrequests/spotify-credentials",
    scope: "action",
    action: {
        type: "get"
    }
};
