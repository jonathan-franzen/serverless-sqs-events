import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { SQSEvent } from 'aws-lambda';
export type EventHandler<T> = (payload: T) => void;
export declare class EventManager<Events extends Record<string, any>> {
    private readonly sqsClient;
    private readonly queueUrl;
    private readonly producer;
    private eventHandlers;
    private readonly localEventEmitter;
    private readonly useLocalMode;
    constructor(queueUrl: string, config: SQSClientConfig, useLocalMode?: boolean);
    private handleEventPayload;
    on<K extends keyof Events>(eventName: K, handler: EventHandler<Events[K]>): void;
    send<K extends keyof Events>(eventName: K, payload: Events[K]): Promise<void>;
    consume(event: SQSEvent): Promise<void>;
}
