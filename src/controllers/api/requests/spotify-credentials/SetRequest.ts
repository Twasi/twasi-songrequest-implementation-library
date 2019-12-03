import {IAPIRequest} from "../../APIConnectionController";

export const SetRequest: (code: string) => IAPIRequest = (code: string) => {
    return {
        topic: "twasi-songrequests/spotify-credentials",
        scope: "action",
        action: {
            type: "set",
            code
        }
    }
};
