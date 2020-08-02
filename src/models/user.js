const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      validate(value) {
        if (value < 0) {
          throw new Error('Age must be a positive number!');
        }
      },
    },
    email: {
      type: String,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(password) {
        if (password.includes('password')) {
          throw new Error('password can not include the word password');
        }
      },
    },
    tokens: {
      type: Array,
    },
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.virtual('tasks', {
  ref: 'task',
  localField: '_id',
  foreignField: 'owner',
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.tokens;
  delete userObject.password;
  delete userObject.avatar;
  return userObject;
};

userSchema.methods.generateAuthToken = async user => {
  const token = jwt.sign({ _id: user._id }, 'tasks');
  user.tokens = [...user.tokens, { token }];
  await user.save();
  return token;
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  let isValidPassword;
  if (!user) {
    throw new Error('no user found');
  }

  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (e) {
    throw new Error(e);
  }

  if (!isValidPassword) {
    throw new Error('Password not valid');
  }

  return user;
};

const User = mongoose.model('user', userSchema);

module.exports = User;
