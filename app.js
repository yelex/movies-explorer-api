const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');

const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const NotFoundError = require('./errors/not-found');

const { PORT = 3001 } = process.env;

const app = express();
require('dotenv').config();

const { NODE_ENV, MONGO_URL } = process.env;

mongoose.connect(NODE_ENV === 'production' ? MONGO_URL : 'mongodb://localhost:27017/bitfilmsdb');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // для приёма веб-страниц внутри POST-запроса
app.use(express.json());
app.use(requestLogger); // подключаем логгер запросов

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', NODE_ENV === 'production' ? 'https://yellex.nomoredomains.work' : 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  const { method } = req;

  const DEFAULT_ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE';
  const requestHeaders = req.headers['access-control-request-headers'];

  if (method === 'OPTIONS') {
    res.header('Access-Control-Allow-Headers', requestHeaders);
    res.header('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
    return res.end();
  }
  return next();
});

app.use(authRouter);
app.use(auth);
app.use(usersRouter);
app.use(moviesRouter);

app.all('*', (req, res, next) => {
  next(new NotFoundError('Страница по указанному маршруту не найдена.'));
});

app.use(errorLogger);
app.use(errors());

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;

  res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка.'
        : message,
    });
  next();
});

app.listen(PORT, () => {
});
