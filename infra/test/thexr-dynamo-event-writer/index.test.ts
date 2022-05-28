import * as writer from '../../lib/thexr-dynamo-event-writer/index'

test('writer test', async () => {

    let result = writer.buildSpaceExpressions([{ space_id: "abc", sequence: 1 },
    { space_id: "abc", sequence: 2 }])
    console.log('result', JSON.stringify(result, null, 2))


});
