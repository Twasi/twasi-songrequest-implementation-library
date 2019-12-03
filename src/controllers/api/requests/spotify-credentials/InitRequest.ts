import {IAPIRequest} from "../../APIConnectionController";

export const InitRequest: IAPIRequest = {
    topic: "twasi-songrequests/spotify-credentials",
    scope: "action",
    action: {
        type: "init"
    }
};
