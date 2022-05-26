import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';


export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AppQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // const bus = new events.EventBus(this, 'eventbus', {
    //   eventBusName: 'ThexrEventBus'
    // });

    // create a queue

    const eventQueue = new sqs.Queue(this, 'ThexrEventQueue', {
      queueName: "ThexrEventQueue.fifo",
      fifo: true
    });


    // create a rule to pipe events to SQS

    // const rule = new events.Rule(this, 'event_to_sqs', {
    //   ruleName: "events-to-sqs-rule",
    //   eventPattern: {
    //     source: ["dev", "prod"]
    //   },
    //   eventBus: bus,
    //   description: "send Thexr events to SQS"
    // });

    // rule.addTarget(new targets.SqsQueue(eventQueue));


    const lambdaDynamoEventWriter = new NodejsFunction(this, 'ThexrDynamoEventWriter', {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      functionName: 'write-events-to-dynamo',
      entry: path.join(__dirname, `./thexr-dynamo-event-writer/index.ts`),
    });

    lambdaDynamoEventWriter.addEventSource(new eventsources.SqsEventSource(eventQueue));


  }
}
