import {IAPIRequest} from "../../APIConnectionController";

export const BackRequest: IAPIRequest = {
    topic: "twasi-songrequests/events",
    scope: "action",
    action: {
        type: "back"
    }
};
