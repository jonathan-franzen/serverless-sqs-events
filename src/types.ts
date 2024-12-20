export interface SQSEvent {
	Records: SQSRecord[];
}

export type EventHandler<T> = (payload: T) => void;

interface SQSRecord {
	messageId: string;
	receiptHandle: string;
	body: string;
	attributes: SQSRecordAttributes;
	messageAttributes: SQSMessageAttributes;
	md5OfBody: string;
	md5OfMessageAttributes?: string;
	eventSource: string;
	eventSourceARN: string;
	awsRegion: string;
}

interface SQSRecordAttributes {
	AWSTraceHeader?: string | undefined;
	ApproximateReceiveCount: string;
	SentTimestamp: string;
	SenderId: string;
	ApproximateFirstReceiveTimestamp: string;
	SequenceNumber?: string | undefined;
	MessageGroupId?: string | undefined;
	MessageDeduplicationId?: string | undefined;
	DeadLetterQueueSourceArn?: string | undefined;
}

type SQSMessageAttributeDataType = 'String' | 'Number' | 'Binary' | string;

interface SQSMessageAttribute {
	stringValue?: string | undefined;
	binaryValue?: string | undefined;
	stringListValues?: string[] | undefined;
	binaryListValues?: string[] | undefined;
	dataType: SQSMessageAttributeDataType;
}

interface SQSMessageAttributes {
	[name: string]: SQSMessageAttribute;
}
