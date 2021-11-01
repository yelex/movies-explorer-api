const moviesRouter = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const validator = require('validator');
const {
  getMovies, createMovie, deleteMovie,
} = require('../controllers/movies');

moviesRouter.get('/', getMovies);

moviesRouter.post('/', celebrate({
  body: Joi.object().keys({
    country: Joi.string().required().min(2),
    director: Joi.string().required().min(2),
    duration: Joi.number().required(),
    year: Joi.string().required().min(1),
    description: Joi.string().required().min(2),
    image: Joi.string().required().custom((value, helper) => {
      if (!validator.isURL(value, { require_protocol: true })) {
        return helper.message('Invalid link');
      }
      return value;
    }),
    trailer: Joi.string().required().custom((value, helper) => {
      if (!validator.isURL(value, { require_protocol: true })) {
        return helper.message('Invalid link');
      }
      return value;
    }),
    nameRU: Joi.string().required().min(2),
    nameEN: Joi.string().required().min(2),
    thumbnail: Joi.string().required().custom((value, helper) => {
      if (!validator.isURL(value, { require_protocol: true })) {
        return helper.message('Invalid link');
      }
      return value;
    }),
    movieId: Joi.number().required(),

  }),
}), createMovie);

moviesRouter.delete('/:movieId', celebrate({
  params: {
    movieId: Joi.string().length(24).hex(),
  },
}), deleteMovie);

module.exports = moviesRouter;
