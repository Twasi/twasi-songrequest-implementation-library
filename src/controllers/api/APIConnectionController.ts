import {Song} from "../../models/Song";
import {Add} from "./requests/songrequests/AddRequest";
import {GetQueue} from "./requests/songrequests/GetQueue";
import {Next} from "./requests/songrequests/NextRequest";

export class APIConnectionController {
    public requests: APIRequestManager;

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
        this.requests = new APIRequestManager(this.client);
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

    public async add(song: Song) {
        return await this.requests.request(Add(song));
    }

    public async getQueue() {
        return (await this.requests.request(GetQueue)).result;
    }

    public async next(skip: boolean = false) {
        return await this.requests.request(Next(skip));
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
    private client: WebSocket;

    constructor(client: WebSocket) {
        this.client = client;
        this.client.onmessage = (msg) => {
            const ob = JSON.parse(msg.data) as any;
            if (this.pending.has(ob.ref)) {
                this.pending.get(ob.ref)(ob.result);
                this.pending.delete(ob.ref);
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

    private newRef(): string {
        return (this.count++).toString();
    }
}
