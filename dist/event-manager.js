var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from 'events';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Producer } from 'sqs-producer';
export class EventManager {
    constructor(queueUrl, config, useLocalMode = false) {
        this.eventHandlers = new Map();
        this.sqsClient = new SQSClient(config);
        this.queueUrl = queueUrl;
        this.producer = Producer.create({
            queueUrl: this.queueUrl,
            sqs: this.sqsClient,
        });
        this.localEventEmitter = new EventEmitter();
        this.useLocalMode = useLocalMode;
    }
    handleEventPayload(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedBody = JSON.parse(body);
            const { event, payload } = parsedBody;
            const handler = this.eventHandlers.get(event);
            if (!handler) {
                throw new Error(`No handler registered for event: "${event}"`);
            }
            handler(payload);
        });
    }
    on(eventName, handler) {
        if (this.useLocalMode) {
            this.localEventEmitter.on(String(eventName), handler);
        }
        else {
            if (this.eventHandlers.has(eventName)) {
                throw new Error(`Event "${String(eventName)}" is already registered.`);
            }
            this.eventHandlers.set(eventName, handler);
        }
    }
    send(eventName, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.useLocalMode) {
                this.localEventEmitter.emit(String(eventName), payload);
            }
            else {
                try {
                    const message = {
                        id: `${String(eventName)}-${Date.now()}`,
                        body: JSON.stringify({ event: eventName, payload }),
                    };
                    yield this.producer.send([message]);
                }
                catch (error) {
                    throw new Error(`Failed to send event "${String(eventName)}": ${error}`);
                }
            }
        });
    }
    consume(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.useLocalMode) {
                throw new Error('Lambda handler is not supported in local mode.');
            }
            for (const record of event.Records) {
                try {
                    yield this.handleEventPayload(record.body);
                }
                catch (error) {
                    throw new Error(`Error processing record: ${error}`);
                }
            }
        });
    }
}
