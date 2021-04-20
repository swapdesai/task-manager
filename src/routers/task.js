const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const { user } = req;
  const task = new Task({
    ...req.body,
    owner: user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const logPrefix = logger.child({ logPrefix: 'getTasks' });
  logPrefix.info('started');

  const { user } = req;
  const { completed } = req.query;
  const { limit } = req.query;
  const { skip } = req.query;
  const { sortBy } = req.query;

  const match = {};
  if (completed) {
    match.completed = completed === 'true';
  }

  const sort = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(limit, 10),
          skip: parseInt(skip, 10),
          sort,
        },
      })
      .execPopulate();

    const { tasks } = user;
    logPrefix.debug(JSON.stringify(tasks));
    res.send(tasks);
  } catch (error) {
    logPrefix.error(error);
    res.status(500).send(error);
  } finally {
    logPrefix.info('finished');
  }
});

/* eslint consistent-return: off */
router.get('/tasks/:id', auth, async (req, res) => {
  const { user } = req;
  const taskId = req.params.id;

  try {
    const task = await Task.findOne({
      _id: taskId,
      owner: user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    return res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];

  // prettier-ignore
  const isUpdatesValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isUpdatesValid) {
    return res.status(400).send({
      error: 'Invalid updates!',
    });
  }

  const { user } = req;
  const taskId = req.params.id;

  try {
    const task = await Task.findOne({
      _id: taskId,
      owner: user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    // prettier-ignore
    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    task.save();

    res.send(task);
  } catch (error) {
    // console.log(error);
    res.status(400).send(error);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  const { user } = req;
  const taskId = req.params.id;

  try {
    const task = await Task.findOneAndDelete({
      _id: taskId,
      owner: user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    res.status(204).send();
  } catch (error) {
    // console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
