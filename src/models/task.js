const mongoose = require('mongoose');

const taskModel = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'user',
    },
  },
  { timestamps: true },
);

const Task = mongoose.model('task', taskModel);

module.exports = Task;
