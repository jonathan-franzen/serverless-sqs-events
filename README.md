## Serverless SQS Events

Event Manager to register and send typed events to SQS, with serverless handler function to automatically consume messages and trigger events.

### Installation

`yarn install serverless-sqs-events`

### Usage

Set up an event file to create the EventManager and register events.
```
// src/events/index.ts

import { EventManager, SQSEvent } from 'serverless-sqs-events';

const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
const region = 'us-east-1';

interface Events {
  logUsername: { username: string };
}

async function logUsername({ username }: { username: string }) {
  console.log(username);
}

const sqsEventManager = new EventManager<Events>(queueUrl, { region: region });

eventManager.on('logUsername', logUsername);

export default eventManager;
```

Whenever you need to emit an event, just import the eventManager & "send" the event.
```
// src/run.ts

import eventManager from '@/events/index.js';

eventManager.send('logUsername', { username: 'John Doe' });
```

Set up a handler function that is triggered whenever an event is sent to the queue.
```
// src/worker.ts

import eventManager from '@/events/index.js';
import { SQSEvent } from 'serverless-sqs-events';

export const handler = (sqsEvent: SQSEvent) => eventManager.consume(sqsEvent);
```

Optionally run everything on NodeJS EventEmitter.
```
const sqsEventManager = new EventManager<Events>(queueUrl, { region: region }, true);
```

### Serverless example

```
// serverless.yml

provider:
  name: aws
  runtime: nodejs20.x
  region: eu-north-1
  stage: ${opt:stage, 'staging'}
  timeout: 20
  iamRoleStatements:
    - Effect: Allow
      Action:
        - sqs:SendMessage
        - sqs:DeleteMessageBatch
      Resource:
        - Fn::GetAtt: [MessagesQueue, Arn]

functions:
  worker:
    handler: src/worker.handler
    events:
      - sqs:
          arn:
            Fn::GetAtt:
              - workqueue
              - Arn

resources:
  Resources:
    workqueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: workqueue
        VisibilityTimeout: 120
```
