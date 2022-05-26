


import { SQSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk'

const client = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.tableName || ""

export const handler = async (event: SQSEvent) => {
    //console.log("in the handler", JSON.stringify(event))

    const new_events = event.Records.map(record => {
        return JSON.parse(record.body)
    })


    let input: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: TABLE_NAME,
        Key: { space_id: new_events[0]["space_id"], sequence_range: "1-1000" },
        UpdateExpression: "set #columnName = list_append(if_not_exists(#columnName, :empty_list), :new_events)",
        ExpressionAttributeNames: {
            "#columnName": "1-100",
        },
        ExpressionAttributeValues: {
            ":new_events": new_events,
            ":empty_list": []
        }
    }

    console.log('input', JSON.stringify(input))

    let result = await client.update(input).promise()
    console.log('result', JSON.stringify(result))



}

