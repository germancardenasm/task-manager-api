const express = require('express');
require('./db/mongoose');
const User = require('./models/user');
const Task = require('./models/task');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');

const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(tasksRouter);
app.use(usersRouter);

app.listen(PORT, () => {
  console.log('Listening port: ', PORT);
});
