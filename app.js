const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { celebrate, Joi, errors } = require('celebrate');

const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const NotFoundError = require('./errors/not-found');
const { login, createUser, signOut } = require('./controllers/users');

const { PORT = 3001 } = process.env;

const app = express();

mongoose.connect('mongodb://localhost:27017/bitfilmsdb');

require('dotenv').config();

const { NODE_ENV } = process.env;
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // для приёма веб-страниц внутри POST-запроса
app.use(express.json());
app.use(requestLogger); // подключаем логгер запросов

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', NODE_ENV === 'production' ? 'https://yellex.nomoredomains.work' : 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  const { method } = req; // Сохраняем тип запроса (HTTP-метод) в соответствующую переменную

  // Значение для заголовка Access-Control-Allow-Methods по умолчанию (разрешены все типы запросов)
  const DEFAULT_ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE';
  const requestHeaders = req.headers['access-control-request-headers'];
  // Если это предварительный запрос, добавляем нужные заголовки
  if (method === 'OPTIONS') {
    // разрешаем любые заголовки
    res.header('Access-Control-Allow-Headers', requestHeaders);
    // разрешаем кросс-доменные запросы любых типов (по умолчанию)
    res.header('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
    return res.end(); // возможно нужно удалить
  }
  return next();
});

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
}), login);

app.post('/signout', signOut);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    name: Joi.string().required().min(2).max(30),
  }),
}), createUser);

app.use(auth);
app.use('/users', usersRouter);
app.use('/movies', moviesRouter);

app.all('*', (req, res, next) => {
  next(new NotFoundError('Ресурс не найден'));
});

app.use(errorLogger);
app.use(errors());

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;

  res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка'
        : message,
    });
  next();
});

app.listen(PORT, () => {
});
