const express = require('express');
const User = require('../models/user');
const _ = require('lodash');
const auth = require('../middleware/auth');

const multer = require('multer');
const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
      return cb(new Error('Please provide an image'));
    }
    cb(undefined, true);
  },
});

const router = express.Router();

//Create User
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    const token = await user.generateAuthToken(user);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/login', async (req, res) => {
  const { password, email } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken(user);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/logout', auth, async (req, res) => {
  const { user, token } = req;
  try {
    user.tokens = user.tokens.filter(currToken => currToken.token !== token);
    user.save();
    res.status(201).send(req.user);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post('/users/logout/all', auth, async (req, res) => {
  const { user, token } = req;
  try {
    user.tokens = [];
    user.save();
    res.status(201).send(req.user);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get('/users/me', auth, async (req, res) => {
  try {
    const a = await req.user.populate('tasks').execPopulate();
    console.log({ a });
    res.send(req.user);
  } catch (error) {
    console.log('error', error);
    res.status(404).send(error);
  }
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      req.user.avatar = req.file.buffer;
      await req.user.save();
      res.status(200).send();
    } catch (error) {
      res.status(404).send(error);
    }
  },
  (error, req, res, next) => {
    res.status(400).send(error.message);
  },
);

router.get(
  '/users/:id/avatar',
  auth,
  async (req, res) => {
    const _id = req.params.id;
    console.log('id', _id);
    try {
      const user = await User.findById(_id);
      if (!user | !user.avatar) {
        return res.status(400).send('No user with the id provided');
      }
      res.set('Content-Type', 'image/png').status(200).send(user.avatar);
    } catch (error) {
      res.status(404).send(error);
    }
  },
  (error, req, res, next) => {
    res.status(400).send(error.message);
  },
);

router.patch('/users', auth, async (req, res) => {
  const allowedFieldsToUpdate = ['name', 'age', 'email', 'password'];
  const requestedFieldsToUpdate = Object.keys(req.body);
  const isValidUpdate = !_.difference(requestedFieldsToUpdate, allowedFieldsToUpdate).length;
  if (isValidUpdate) {
    try {
      const { user } = req;
      requestedFieldsToUpdate.forEach(field => (user[field] = req.body[field]));
      await user.save();
      res.status(200).send(user);
    } catch (error) {
      res.status(404).send(error);
    }
  } else {
    res.status(400).send('Requested fields are not allowed');
  }
});

router.delete('/users/me', auth, async (req, res) => {
  const { user } = req;
  try {
    await user.remove();
    res.send(user);
  } catch (error) {
    console.log('error', error);
    res.status(505).send();
  }
});

module.exports = router;
