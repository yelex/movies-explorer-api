const usersRouter = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const {
  updateUserProfile,
  getInfoAboutMe,
} = require('../controllers/users');

usersRouter.get('/users/me', getInfoAboutMe);
usersRouter.patch('/users/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    email: Joi.string().email(),
  }),
}), updateUserProfile);

module.exports = usersRouter;
