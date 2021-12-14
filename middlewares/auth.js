const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../errors/unauthorized'); // 401

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return (next(new UnauthorizedError('При авторизации произошла ошибка. Токен не передан или передан не в том формате.')));
  }

  let payload;

  try {
    payload = jwt.verify(token, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
  } catch (err) {
    return (next(new UnauthorizedError('При авторизации произошла ошибка. Переданный токен некорректен.')));
  }

  req.user = payload; // в объект запроса записываем user: _id

  return next();
};
