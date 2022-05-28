import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
// import * as events from 'aws-cdk-lib/aws-events'
// import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';


export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here


    // create a queue

    const eventQueue = new sqs.Queue(this, 'ThexrEventQueue', {
      queueName: "ThexrEventQueue.fifo",
      fifo: true
    });

    // create dynamodb

    const table = new dynamodb.Table(this, 'thexr-eventstreams', {
      partitionKey: { name: 'space_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sequence', type: dynamodb.AttributeType.NUMBER },
      tableName: "thexr-event-streams",
      timeToLiveAttribute: "TTL"
    });

    // create lambda

    const lambdaDynamoEventWriter = new NodejsFunction(this, 'ThexrDynamoEventWriter', {
      memorySize: 256,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      functionName: 'write-events-to-dynamo',
      entry: path.join(__dirname, `./thexr-dynamo-event-writer/index.ts`),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // event source for lambda
    lambdaDynamoEventWriter.addEventSource(
      new eventsources.SqsEventSource(eventQueue, { batchSize: 1 })
    );

    table.grantReadWriteData(lambdaDynamoEventWriter)

  }
}
