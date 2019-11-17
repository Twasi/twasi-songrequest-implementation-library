import {Provider} from "./Provider";

export interface Song {
    provider: Provider,
    name: string,
    artists: Array<string>,
    covers?: Array<string>,
    duration: number
}
