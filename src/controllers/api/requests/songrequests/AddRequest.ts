import {IAPIRequest} from "../../APIConnectionController";
import {Song} from "../../../../models/Song";

export const AddRequest = (song: Song): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: "add",
            song
        }
    }
};
