const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/not-found'); // 404
const InternalError = require('../errors/internal-err'); // 500
const BadRequestError = require('../errors/bad-request'); // 400
const ConflictError = require('../errors/conflict'); // 409
const UnauthorizedError = require('../errors/unauthorized'); // 401

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.getInfoAboutMe = (req, res, next) => {
  User.findById({ _id: req.user._id })
    .then((user) => {
      const {
        _id, name, email,
      } = user;
      res.send({
        name, _id, email,
      });
    })
    .catch(() => {
      next(new InternalError('На сервере произошла ошибка'));
    });
};

module.exports.updateUserProfile = (req, res, next) => {
  const { name, email } = req.body;

  User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw Error('404');
      }
      res.send({
        name, email,
      });
    })
    .catch((err) => {
      if (err.message === '404') {
        next(new NotFoundError('Пользователь не найден'));
        return;
      }
      if (err.name === 'MongoServerError' && err.code === 11000) {
        next(new ConflictError('Такой e-mail уже существует'));
        return;
      }
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
        return;
      }

      next(new InternalError('На сервере произошла ошибка'));
    });
};

module.exports.createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;

  bcrypt.hash(password, 10).then((hash) => {
    User.create({
      name, email, password: hash,
    })
      .then((user) => {
        const {
          _id,
        } = user;
        res.send({
          name, email, _id,
        });
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          next(new BadRequestError('Переданы некорректные данные'));
          return;
        }
        if (err.name === 'MongoServerError' && err.code === 11000) {
          next(new ConflictError('Такой e-mail уже существует'));
          return;
        }
        next(new InternalError('На сервере произошла ошибка'));
      });
  }).catch(() => {
    next(new InternalError('На сервере произошла ошибка'));
  });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');

      res
        .cookie('jwt', token, {
          httpOnly: true,
          maxAge: 3600000 * 24 * 7,
          sameSite: false,
          secure: NODE_ENV === 'production',
        }).send({ token });
    })
    .catch((e) => {
      next(new UnauthorizedError(e.message));
    });
};

module.exports.signOut = (req, res) => res.clearCookie('jwt').send();
