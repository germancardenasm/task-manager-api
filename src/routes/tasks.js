const express = require('express');
const Task = require('../models/task');
const _ = require('lodash');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  try {
    await task.save();
    const a = await task.populate('owner').execPopulate();
    res.status(201).send(task.populate('owner'));
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }
  if (req.query.sortBy) {
    const [field, order] = req.query.sortBy.split('_');
    sort[field] = order === 'asc' ? 1 : -1;
  }

  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: +req.query.limit,
          skip: +req.query.skip,
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    console.log({ error });
    res.status(500).send(error);
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    console.log({ error });
    res.status(500).send(error);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const allowedFieldsToUpdate = ['title', 'description', 'completed'];
  const requestedFieldsToUpdate = Object.keys(req.body);
  const isValidUpdate = !_.difference(requestedFieldsToUpdate, allowedFieldsToUpdate).length;
  if (isValidUpdate) {
    try {
      const _id = req.params.id;
      const task = await Task.findOne({ _id, owner: req.user._id });
      if (!task) {
        return res.status(404).send();
      }
      requestedFieldsToUpdate.forEach(field => (task[field] = req.body[field]));
      await task.save();
      res.status(200).send(task);
    } catch (error) {
      res.status(404).send(error);
    }
  } else {
    res.status(400).send('Requested fields are not allowed');
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!task) {
      res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
