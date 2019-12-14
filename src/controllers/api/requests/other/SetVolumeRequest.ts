import {IAPIRequest} from "../../APIConnectionController";

export const SetVolumeRequest = (volume: number, deviceId: string, token: string): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: "setVolume",
            volume,
            deviceId,
            token
        }
    }
};
