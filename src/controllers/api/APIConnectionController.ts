import {Song} from "../../models/Song";
import {AddRequest} from "./requests/songrequests/AddRequest";
import {GetQueueRequest} from "./requests/songrequests/GetQueueRequest";
import {NextRequest} from "./requests/songrequests/NextRequest";

export class APIConnectionController {
    public requests: APIRequestManager;
    private events: Map<string, Array<(details: any, timeStamp: Date) => void>> = new Map();

    private client: WebSocket;

    constructor(
        private api: string,
        private jwt: string,
        private statusListener: APIConnectionStatusListener
    ) {
        this.connect();
    }

    private connect() {
        setTimeout(() => {
            this.connect();
        }, 3000);
        if (this.client && this.client.readyState === this.client.OPEN) return;
        this.client = new WebSocket(this.api);
        this.client.onerror = () => {
            this.statusListener.statusChanged(APIConnectionStatus.DISCONNECTED);
        };
        this.client.onopen = () => this.authorize();
        this.client.onclose = () => {
            this.statusListener.statusChanged(APIConnectionStatus.DISCONNECTED);
        };
        this.requests = new APIRequestManager(this.client, this.events);
    }

    private async authorize() {
        let response = await this.requests.request({
            topic: 'auth',
            scope: "action",
            action: {type: 'JWT_TOKEN', token: this.jwt}
        });
        if (response.status === 'success') {
            let channel = response.result.user.twitchId;
            response = await this.requests.request({
                topic: 'twasi-songrequests/events',
                scope: "subscribe",
                config: {channel}
            })
        }
        this.statusListener.statusChanged(response.status === 'success' ? APIConnectionStatus.CONNECTED : APIConnectionStatus.UNAUTHORIZED);
    }

    public on(event: string, handler: (details: any, timeStamp: Date) => void) {
        if (!this.events.has(event)) this.events.set(event, [handler]);
        else this.events.get(event).push(handler);
    }

    public async add(song: Song) {
        return await this.requests.request(AddRequest(song));
    }

    public async getQueue() {
        return (await this.requests.request(GetQueueRequest)).result;
    }

    public async next(skip: boolean = false) {
        return await this.requests.request(NextRequest(skip));
    }
}

export enum APIConnectionStatus {
    CONNECTED, DISCONNECTED, UNAUTHORIZED
}

export interface APIConnectionStatusListener {
    statusChanged: (status: APIConnectionStatus) => void
}

export interface IAPIRequest {
    ref?: string;
    topic: string;
    scope: 'action' | 'subscribe';
    action?: any;
    config?: any;
}

export class APIRequestManager {
    private count: number = 0;
    private pending: Map<string, (res?: any) => void> = new Map();
    private events: Map<string, Array<(details: any, timeStamp: Date) => void>> = new Map();
    private client: WebSocket;

    constructor(client: WebSocket, events?: Map<string, Array<(details: any, timeStamp: Date) => void>>) {
        if (events) this.events = events;
        this.client = client;
        this.client.onmessage = (msg) => {
            const ob = JSON.parse(msg.data) as any;
            if (ob.ref && this.pending.has(ob.ref)) {
                this.pending.get(ob.ref)(ob.result);
                this.pending.delete(ob.ref);
            } else if (ob.event && this.events.has(ob.event)) {
                this.events.get(ob.event).forEach(handler => {
                    handler(ob.details, new Date(ob.timeStamp))
                });
            }
        }
    }

    public request(req: IAPIRequest, timeout: number = 3000): Promise<any> {
        if (!req.ref) req.ref = this.newRef();
        return new Promise<any>((res: (res: any) => void, rej: (err?: any) => void) => {
            this.pending.set(req.ref, res);
            this.client.send(JSON.stringify(req));
            setTimeout(() => {
                if (!this.pending.has(req.ref)) return;
                this.pending.delete(req.ref);
                rej("Timed Out");
            }, timeout);
        })
    }

    public on(event: string, handler: (details: any, timeStamp: Date) => void) {
        if (!this.events.has(event)) this.events.set(event, [handler]);
        else this.events.get(event).push(handler);
    }

    private newRef(): string {
        return (this.count++).toString();
    }
}
