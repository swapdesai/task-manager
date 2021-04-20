const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
// const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    // sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    // console.log(error);
    res.status(400).send(error);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    // eslint-disable-next-line prettier/prettier
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (error) {
    // console.log(error);
    res.status(400).send();
  }
});

router.post('/users/logout', auth, async (req, res) => {
  const { user } = req;
  try {
    user.tokens = user.tokens.filter((token) => token !== req.token);

    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  const { user } = req;
  try {
    user.tokens = [];

    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

/* eslint consistent-return: off */
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];

  // eslint-disable-next-line prettier/prettier
  const isUpdatesValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isUpdatesValid) {
    return res.status(400).send({
      error: 'Invalid updates!',
    });
  }

  const { user } = req;
  try {
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    await user.save();
    res.send(user);
  } catch (error) {
    // console.log(error);
    res.status(400).send(error);
    // res.status(500).send(error) // TODO
  }
});

router.delete('/users/me', auth, async (req, res) => {
  const { user } = req;

  try {
    await user.remove();
    // sendCancelationEmail(req.user.email, req.user.name);
    res.status(204).send();
  } catch (error) {
    // console.log(error);
    res.status(500).send(error);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }

    cb(undefined, true);
  },
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  const { user } = req;
  user.avatar = undefined;
  await user.save();
  res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(400).send();
  }
});

/* eslint-disable */
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => { 
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

  const { user } = req;
  user.avatar = buffer;
  await user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
});

module.exports = router;
