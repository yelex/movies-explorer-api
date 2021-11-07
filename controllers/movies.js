const Movie = require('../models/movie');
const NotFoundError = require('../errors/not-found'); // 404
const InternalError = require('../errors/internal-err'); // 500
const ForbiddenError = require('../errors/forbidden'); // 403
const BadRequestError = require('../errors/bad-request'); // 400

module.exports.getMovies = (req, res, next) => Movie.find({ owner: req.user._id })
  .then((movies) => res.send(movies))
  .catch(() => {
    next(new InternalError('На сервере произошла ошибка'));
  });

module.exports.createMovie = (req, res, next) => Movie.create({
  country: req.body.country,
  director: req.body.director,
  duration: req.body.duration,
  year: req.body.year,
  description: req.body.description,
  image: req.body.image,
  trailer: req.body.trailer,
  nameRU: req.body.nameRU,
  nameEN: req.body.nameEN,
  thumbnail: req.body.thumbnail,
  movieId: req.body.movieId,
  owner: req.user._id,
})
  .then((movie) => {
    res.send(movie);
  })
  .catch((err) => {
    if (err.name === 'ValidationError') {
      next(new BadRequestError('Переданы некорректные данные'));
      return;
    }
    next(new InternalError('На сервере произошла ошибка'));
  });

module.exports.deleteMovie = (req, res, next) => {
  Movie.findById(req.params.movieId).then(
    (movie) => {
      if (!movie) {
        throw new NotFoundError('Фильм не найден');
      }

      if (req.user._id !== movie.owner.toString()) {
        throw new ForbiddenError('Недостаточно прав');
      }
      return movie.remove();
    },
  ).then(
    (movie) => {
      res.send(movie);
    },
  ).catch((err) => {
    if (err.name === 'CastError') {
      next(new BadRequestError('Переданы некорректные данные'));
      return;
    }

    next(err);
  });
};
