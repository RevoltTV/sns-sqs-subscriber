export default (name, sqs) => {
    return sqs.createQueue({
        QueueName: name,
        Attributes: {
            ReceiveMessageWaitTimeSeconds: '20'
        }
    }).promise()
    .then(({ QueueUrl }) => {
        return sqs.getQueueAttributes({
            QueueUrl,
            AttributeNames: ['QueueArn']
        }).promise()
        .then((result) => {
            return {
                arn: result.Attributes.QueueArn,
                url: QueueUrl
            };
        });
    });
};
