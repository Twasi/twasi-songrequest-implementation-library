import {IAPIRequest} from "../../APIConnectionController";

export const NextRequest = (skip: boolean = false): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: skip ? "skip" : "next"
        }
    }
};
