const pino = require('pino');
const rTracer = require('cls-rtracer');

const logger = pino({
  name: process.env.APP_ID,
  level: process.env.ENV === 'production' ? 'info' : 'debug',
  mixin() {
    return { correlationId: rTracer.id() };
  },
  redact: {
    paths: ['headers.authorization'],
    censor: '****',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
