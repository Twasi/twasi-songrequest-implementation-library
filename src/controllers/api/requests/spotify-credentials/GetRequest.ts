import {IAPIRequest} from "../../APIConnectionController";

export const GetRequest: IAPIRequest = {
    topic: "twasi-songrequests/spotify-credentials",
    scope: "action",
    action: {
        type: "get"
    }
};
