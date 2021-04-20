/* eslint-disable no-console, prettier/prettier */
const express = require('express');
const compression = require('compression');
const rTracer = require('cls-rtracer');

const requestResponseLogger = require('./utils/requestResponseLogger');

require('./db/mongoose');

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

app.use(compression());
app.use(express.json());
app.use(
  rTracer.expressMiddleware({
    useHeader: true,
    headerName: 'X-Request-Id',
  })
);
app.use(requestResponseLogger);

app.get('/health', (req, res) => {
  res.json({ health: 'OK' });
});

app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
