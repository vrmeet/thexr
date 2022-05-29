

import { SQSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk'

const client = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || "missing-tablename"

export const upperBoundary = (sequence: number, bucketSize = 100) => {
    // get hundreds place or thousands place depending on bucket size
    const bucketPlace = Math.floor(sequence / bucketSize)
    // if end of bucket, return self
    if (sequence % bucketSize === 0) {
        return sequence
    } else {
        return (bucketPlace + 1) * bucketSize
    }
}


/**
 * 
 * @param sequence 
 * @returns string 1-1000, 1001-2000, 2001-3000
 */
export const sortKey = (sequence: number) => {
    const ending = upperBoundary(sequence, 1000)
    const starting = (ending - 999).toString().padStart(4, "0")
    return `${starting}-${ending}`
}

export const colName = (sequence: number) => {
    const ending = upperBoundary(sequence, 100)
    const starting = (ending - 99).toString().padStart(3, "0")
    return `${starting}-${ending}`
}

export const eventsToRequests = (space_id: string, events: { space_id: string, sequence: number }[]) => {
    // divide requests into sort Key first
    const eventsBySortRange = events.reduce((acc: any, event) => {
        const sortRange = sortKey(event.sequence)
        if (!acc[sortRange]) {
            acc[sortRange] = []
        }
        acc[sortRange].push(event)
        return acc
    }, {})

    let expressions: any = []
    // build expression for each sortRange
    Object.keys(eventsBySortRange).map(sortRange => {
        expressions.push(buildExpression(space_id, sortRange, eventsBySortRange[sortRange]))
    })
    return expressions

}

export const buildExpression = (space_id: string, sortRange: string, events: any[]): DynamoDB.DocumentClient.UpdateItemInput => {
    // split updates by hundreds
    const hundredRanges = events.reduce((acc, event) => {
        const hundredRange = colName(event.sequence)
        if (!acc[hundredRange]) {
            acc[hundredRange] = []
        }
        acc[hundredRange].push(event)
        return acc
    }, {})

    let attribNames: any = {}
    let attribValues: any = { ":empty_list": [] }
    let expression: any = []
    Object.keys(hundredRanges).forEach(hundredRange => {
        const key = hundredRange.replace("-", "_")
        attribNames[`#${key}`] = hundredRange
        attribValues[`:${key}`] = hundredRanges[hundredRange]
        expression.push(`#${key} = list_append(if_not_exists(#${key}, :empty_list), :${key})`)
    })
    expression = 'set ' + expression.join(',')
    return {
        TableName: TABLE_NAME,
        Key: { space_id: space_id, sequence_range: sortRange },
        UpdateExpression: expression,
        ExpressionAttributeNames: attribNames,
        ExpressionAttributeValues: attribValues,
        ReturnValues: 'UPDATED_NEW'
    }
}

export const buildSpaceExpressions = (events: { space_id: string, sequence: number }[]) => {
    const eventsBySpaceId = events.reduce((acc: any, event: any) => {
        // separate by space_id: 
        if (!acc[event.space_id]) {
            acc[event.space_id] = []
        }
        acc[event.space_id].push(event)
        return acc
    }, {})

    let requestExpressions: any[] = []
    Object.keys(eventsBySpaceId).map(space_id => {
        requestExpressions.push(
            eventsToRequests(space_id, eventsBySpaceId[space_id])
        )
    })

    return requestExpressions.flat()

}

// export const handler = async (event: SQSEvent) => {
//     //console.log("in the handler", JSON.stringify(event))

//     const events = event.Records.map(record => {
//         return JSON.parse(record.body)
//     })
//     const expressions = buildSpaceExpressions(events)

//     expressions.forEach(async (expression) => {
//         try {
//             console.log('expression', JSON.stringify(expression))
//             const response = await client.update(expression).promise()
//             console.log('response', JSON.stringify(response))
//         } catch (e) {
//             console.error(e)
//         }
//     })



// }



export const handler = async (event: SQSEvent) => {
    let promises: any = []
    event.Records.map(record => {
        return JSON.parse(record.body)
    }).forEach(async event => {
        const input = {
            TableName: TABLE_NAME,
            Item: {
                TTL: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
                ...event
            }
        }
        promises.push(client.put(input).promise())
    })

    await Promise.all(promises)




}

