const lodash = require('lodash');
const logger = require('./logger');

const requestResponseLogger = async (req, res, next) => {
  const start = Date.now();
  const requestLoggerPrefix = logger.child({
    logPrefix: 'requestResponseLogger',
    category: 'request',
  });

  if (logger.isLevelEnabled('info')) {
    requestLoggerPrefix.info('started');
  }

  requestLoggerPrefix.debug(lodash.pick(req, ['url', 'method', 'headers', 'params', 'query', 'body']));
  // requestLoggerPrefix.debug({
  //   ...lodash.pick(req, ['url', 'method', 'headers', 'params', 'query']),
  //   body: JSON.stringify(req.body),
  // });

  res.on('finish', async () => {
    const timeElapsed = Date.now() - start;
    const responseLoggerPrefix = logger.child({
      logPrefix: 'requestResponseLogger',
      category: 'response',
    });

    if (logger.isLevelEnabled('info')) {
      responseLoggerPrefix.info({
        msg: 'finished',
        timeElapsed,
      });
    }
    responseLoggerPrefix.debug({
      url: res.req.url,
      method: res.req.method,
      headers: res.getHeaders(),
      body: res.body,
      // body: JSON.stringify(res.body),
      statusCode: res.statusCode,
      timeElapsed,
    });
  });

  next();
};

module.exports = requestResponseLogger;
