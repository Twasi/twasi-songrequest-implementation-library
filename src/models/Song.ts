import {Provider} from "./Provider";

export interface Song {
    uri: string;
    provider: Provider,
    name: string,
    artists: Array<string>,
    covers?: Array<string>,
    duration: number
}
