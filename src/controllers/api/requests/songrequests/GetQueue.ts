import {IAPIRequest} from "../../APIConnectionController";

export const GetQueue: IAPIRequest = {
    topic: "twasi-songrequests/events",
    scope: "action",
    action: {
        type: "queue"
    }
};
