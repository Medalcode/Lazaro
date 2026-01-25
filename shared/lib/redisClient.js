const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

let publisher = null;
let subscriber = null;

function getPublisher() {
    if (!publisher) {
        publisher = new Redis(redisConfig);
        publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    }
    return publisher;
}

function getSubscriber() {
    if (!subscriber) {
        subscriber = new Redis(redisConfig);
        subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
    }
    return subscriber;
}

module.exports = {
    getPublisher,
    getSubscriber,
    redisConfig
};
