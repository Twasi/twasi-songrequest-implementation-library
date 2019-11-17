import {TSRIEvents} from "./Events";

export class TSRIController {
    public events?: TSRIEvents;
    private jwt: string;

    public init(jwt: string) {
        this.jwt = jwt;
    }

}
