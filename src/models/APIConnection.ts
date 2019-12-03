import * as ReconnectingWebSocket from '../../providers/reconnecting-websocket/reconnecting-websocket.min';

export class APIConnection {
    public readonly requests: APIRequestManager;

    private readonly client: WebSocket;
    private readonly jwt: string;
    private readonly statusListener: APIConnectionStatusListener;

    constructor(api: string, jwt: string, statusListener: APIConnectionStatusListener) {
        this.jwt = jwt;
        this.statusListener = statusListener;
        this.client = new ReconnectingWebSocket(api, null, {debug: true, reconnectInterval: 500, maxReconnectInterval: 5000, automaticOpen: false}); // TODO disable debug
        this.requests = new APIRequestManager(this.client);
        this.client.onopen = () => this.authorize();
        this.client.onclose = () => this.statusListener.statusChanged(APIConnectionStatus.DISCONNECTED);
        // @ts-ignore *** ReconnectingWebSocket has an 'open' function that normal WebSocket's don't have ***
        this.client.open();
    }

    private async authorize() {
        const result = await this.requests.request({topic: 'auth', scope: "action", action: {type: 'JWT_TOKEN', token: this.jwt}});
        console.log(result);
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
                this.pending.get(ob.ref)(ob);
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
