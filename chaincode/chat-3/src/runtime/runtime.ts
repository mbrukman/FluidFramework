import {
    ConnectionState,
    IContainerContext,
    IDeltaManager,
    IDocumentMessage,
    IDocumentStorageService,
    ILoader,
    IQuorum,
    IRequest,
    IResponse,
    ISequencedDocumentMessage,
    ITree,
    MessageType,
} from "@prague/container-definitions";
import { EventEmitter } from "events";


// Context will define the component level mappings
export class Runtime extends EventEmitter {
    public static async Load(context: IContainerContext): Promise<Runtime> {
        const runtime = new Runtime(context);
        return runtime;
    }

    public get connectionState(): ConnectionState {
        return this.context.connectionState;
    }

    public get tenantId(): string {
        return this.context.tenantId;
    }

    public get id(): string {
        return this.context.id;
    }

    public get parentBranch(): string {
        return this.context.parentBranch;
    }

    public get existing(): boolean {
        return this.context.existing;
    }

    // tslint:disable-next-line:no-unsafe-any
    public get options(): any {
        return this.context.options;
    }

    public get clientId(): string {
        return this.context.clientId;
    }

    public get clientType(): string {
        return this.context.clientType;
    }

    public get deltaManager(): IDeltaManager<ISequencedDocumentMessage, IDocumentMessage> {
        return this.context.deltaManager;
    }

    public get storage(): IDocumentStorageService {
        return this.context.storage;
    }

    public get branch(): string {
        return this.context.branch;
    }

    public get minimumSequenceNumber(): number {
        return this.context.minimumSequenceNumber;
    }

    public get submitFn(): (type: MessageType, contents: any) => number {
        return this.context.submitFn;
    }

    public get snapshotFn(): (message: string) => Promise<void> {
        return this.context.snapshotFn;
    }

    public get closeFn(): () => void {
        return this.context.closeFn;
    }

    public get loader(): ILoader {
        return this.context.loader;
    }

    public get connected(): boolean {
        return this.connectionState === ConnectionState.Connected;
    }

    private closed = false;
    private requestHandler: (request: IRequest) => Promise<IResponse>;

    private constructor(private readonly context: IContainerContext) {
        super();
    }

    public registerRequestHandler(handler: (request: IRequest) => Promise<IResponse>) {
        this.requestHandler = handler;
    }

    public async request(request: IRequest): Promise<IResponse> {
        if (!this.requestHandler) {
            return { status: 404, mimeType: "text/plain", value: `${request.url} not found` };
        } else {
            return this.requestHandler(request);
        }
    }

    public async snapshot(tagMessage: string): Promise<ITree> {
        const root: ITree = { entries: [], sha: null };
        return root;
    }

    public async requestSnapshot(tagMessage: string): Promise<void> {
        return this.context.requestSnapshot(tagMessage);
    }

    public async stop(): Promise<void> {
        this.verifyNotClosed();
        this.closed = true;
    }

    public changeConnectionState(value: ConnectionState, clientId: string) {
        this.verifyNotClosed();
        if (value === ConnectionState.Connected) {
            this.emit("connected", this.clientId);
        }
    }

    public prepare(message: ISequencedDocumentMessage, local: boolean): Promise<any> {
        return;
    }

    public process(message: ISequencedDocumentMessage, local: boolean, context: any) {
        this.emit("op", message);
    }

    public async postProcess(
        message: ISequencedDocumentMessage,
        local: boolean,
        context: any,
    ): Promise<void> {
    }

    public submitMessage(type: MessageType, content: any) {
        this.submit(type, content);
    }

    public getQuorum(): IQuorum {
        return this.context.quorum;
    }

    public error(error: any) {
        this.context.error(error);
    }

    private submit(type: MessageType, content: any) {
        this.verifyNotClosed();
        this.submitFn(type, content);
    }

    private verifyNotClosed() {
        if (this.closed) {
            throw new Error("Runtime is closed");
        }
    }

}
