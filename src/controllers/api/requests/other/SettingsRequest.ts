import {IAPIRequest} from "../../APIConnectionController";
import {Settings} from "../../../../models/Settings";

export const SettingsRequest = (settings?: Settings): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: "settings",
            settings
        }
    }
};
