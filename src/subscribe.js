import _ from 'lodash';

import createTopic from './create-topic';

function getDefaultPolicy(queueArn) {
    return {
        Version: '2012-10-17',
        Id: `${queueArn}/SQSDefaultPolicy`,
        Statement: [{
            Sid: `Sid${new Date().getTime()}`,
            Effect: 'Allow',
            Principal: '*',
            Action: 'SQS:SendMessage',
            Resource: queueArn,
            Condition: {
                ArnEquals: {
                    'aws:SourceArn': []
                }
            }
        }]
    };
}

function updatePolicy(originalPolicy, queue, topicArn, sqs) {
    let policy = getDefaultPolicy(queue.arn);

    if (originalPolicy && _.isString(originalPolicy)) {
        policy = JSON.parse(originalPolicy);
    }

    if (_.isString(policy.Statement[0].Condition.ArnEquals['aws:SourceArn'])) {
        policy.Statement[0].Condition.ArnEquals['aws:SourceArn'] = [policy.Statement[0].Condition.ArnEquals['aws:SourceArn']];
    }

    if (!_.find(policy.Statement[0].Condition.ArnEquals['aws.SourceArn'], topicArn)) {
        policy.Statement[0].Condition.ArnEquals['aws:SourceArn'].push(topicArn);
    }

    return sqs.setQueueAttributes({
        QueueUrl: queue.url,
        Attributes: {
            Policy: JSON.stringify(policy)
        }
    }).promise();
}

export default function subscribe(queue, topic, sns, sqs) {
    return createTopic(topic, sns)
    .then((topicArn) => {
        return sqs.getQueueAttributes({
            QueueUrl: queue.url,
            AttributeNames: ['Policy']
        }).promise()
        .then((result) => {
            return updatePolicy(_.get(result, 'Attributes.Policy'), queue, topicArn, sqs);
        })
        .then(() => {
            return topicArn;
        });
    })
    .then((topicArn) => {
        return sns.subscribe({
            Protocol: 'sqs',
            TopicArn: topicArn,
            Endpoint: queue.arn
        }).promise()
        .then(({ SubscriptionArn }) => {
            return sns.setSubscriptionAttributes({
                SubscriptionArn,
                AttributeName: 'RawMessageDelivery',
                AttributeValue: 'true'
            }).promise();
        });
    });
}
