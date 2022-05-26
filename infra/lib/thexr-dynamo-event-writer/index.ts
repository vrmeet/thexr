


import { SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
    console.log("in the handler", event, JSON.stringify(event))
}

