import { EventEmitter } from 'events';
import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';
import { SQSEvent } from 'aws-lambda';
import { Producer } from 'sqs-producer';

export type EventHandler<T> = (payload: T) => void;

export class EventManager<Events extends Record<string, any>> {
	private readonly sqsClient: SQSClient;
	private readonly queueUrl: string;
	private readonly producer: Producer;
	private eventHandlers: Map<keyof Events, EventHandler<any>> = new Map<keyof Events, EventHandler<any>>();
	private readonly localEventEmitter: EventEmitter;
	private readonly useLocalMode: boolean;

	/**
	 * Constructor to initialize the EventManager.
	 * @param queueUrl - The URL of the SQS queue.
	 * @param config - Configuration for the SQS client.
	 * @param useLocalMode - Whether to run in local mode, only EventEmitter (default: false).
	 */
	constructor(queueUrl: string, config: SQSClientConfig, useLocalMode: boolean = false) {
		this.sqsClient = new SQSClient(config);
		this.queueUrl = queueUrl;
		this.producer = Producer.create({
			queueUrl: this.queueUrl,
			sqs: this.sqsClient,
		});
		this.localEventEmitter = new EventEmitter();
		this.useLocalMode = useLocalMode;
	}

	/**
	 * Processes the event payload by invoking the appropriate handler.
	 * @param body - The raw JSON string containing the event and payload.
	 */
	private async handleEventPayload(body: string): Promise<void> {
		const parsedBody: any = JSON.parse(body);
		const { event, payload } = parsedBody;
		const handler: EventHandler<any> | undefined = this.eventHandlers.get(event);

		if (!handler) {
			throw new Error(`No handler registered for event: "${event}"`);
		}

		handler(payload);
	}

	/**
	 * Registers an event handler for a specific event.
	 * @param eventName - The name of the event to handle.
	 * @param handler - The function to call when the event is triggered.
	 */
	on<K extends keyof Events>(eventName: K, handler: EventHandler<Events[K]>): void {
		if (this.useLocalMode) {
			this.localEventEmitter.on(String(eventName), handler);
		} else {
			if (this.eventHandlers.has(eventName)) {
				throw new Error(`Event "${String(eventName)}" is already registered.`);
			}
			this.eventHandlers.set(eventName, handler);
		}
	}

	/**
	 * Sends an event to the appropriate handler or SQS queue.
	 * @param eventName - The name of the event to send.
	 * @param payload - The payload of the event.
	 */
	async send<K extends keyof Events>(eventName: K, payload: Events[K]): Promise<void> {
		if (this.useLocalMode) {
			this.localEventEmitter.emit(String(eventName), payload);
		} else {
			try {
				const message = {
					id: `${String(eventName)}-${Date.now()}`,
					body: JSON.stringify({ event: eventName, payload }),
				};
				await this.producer.send([message]);
			} catch (error) {
				throw new Error(`Failed to send event "${String(eventName)}": ${error}`);
			}
		}
	}

	/**
	 * Processes incoming SQS events and invokes the appropriate handlers.
	 * @param event - The SQS event containing records to process.
	 */
	async consume(event: SQSEvent): Promise<void> {
		if (this.useLocalMode) {
			throw new Error('Lambda handler is not supported in local mode.');
		}

		for (const record of event.Records) {
			try {
				await this.handleEventPayload(record.body);
			} catch (error) {
				throw new Error(`Error processing record: ${error}`);
			}
		}
	}
}
