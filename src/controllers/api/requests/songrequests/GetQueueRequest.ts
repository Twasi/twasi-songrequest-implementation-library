import {IAPIRequest} from "../../APIConnectionController";

export const GetQueueRequest: IAPIRequest = {
    topic: "twasi-songrequests/events",
    scope: "action",
    action: {
        type: "queue"
    }
};
