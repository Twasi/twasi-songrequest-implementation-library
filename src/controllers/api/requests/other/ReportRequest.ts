import {IAPIRequest} from "../../APIConnectionController";

export const ReportRequest = (report: any): IAPIRequest => {
    return {
        topic: "twasi-songrequests/events",
        scope: "action",
        action: {
            type: "report",
            report
        }
    }
};
