import _   from 'lodash';
import AWS from 'aws-sdk';

import createQueue from './create-queue';
import createTopic from './create-topic';
import subscribe   from './subscribe';

export createQueue from './create-queue';
export createTopic from './create-topic';
export subscribe   from './subscribe';

export default function (config = {
    // Required parameters
    queue: '',
    subscriptions: [],
    topic: ''
}) {
    config.sns = config.sns || new AWS.SNS();
    config.sqs = config.sqs || new AWS.SQS();

    // Validate configuration
    if (!config.topic) {
        throw new TypeError('topic is required');
    }

    if (!config.queue) {
        throw new TypeError('queue is required');
    }

    return createTopic(config.topic, config.sns)
    .then((topicArn) => {
        return createQueue(config.queue, config.sqs)
        .then((queue) => {
            return Promise.all(
                _.map(config.subscriptions, (topic) => {
                    return subscribe(queue, topic, config.sns, config.sqs);
                })
            )
            .then(() => {
                return queue;
            });
        })
        .then((queue) => {
            return {
                topicArn: topicArn,
                queueArn: queue.arn,
                queueUrl: queue.url
            };
        });
    });
}
