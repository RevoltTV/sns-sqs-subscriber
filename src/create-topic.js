export default function createTopic(name, sns) {
    return sns.createTopic({
        Name: name
    }).promise()
    .then(({ TopicArn }) => {
        return TopicArn;
    });
}
