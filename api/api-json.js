import loginHandler from './_handlers/auth/login.js';
import registerHandler from './_handlers/auth/register.js';
import refreshHandler from './_handlers/auth/refresh.js';
import googleHandler from './_handlers/auth/google.js';
import meHandler from './_handlers/users/me.js';
import updateHandler from './_handlers/users/update.js';
import ordersHandler from './_handlers/orders.js';
import usersHandler from './_handlers/users.js';
import reviewsHandler from './_handlers/reviews.js';

export default async function handler(req, res) {
  const url = req.url.split('?')[0];

  switch (url) {
    case '/api/auth/login':
      return loginHandler(req, res);
    case '/api/auth/register':
      return registerHandler(req, res);
    case '/api/auth/refresh':
      return refreshHandler(req, res);
    case '/api/auth/google':
      return googleHandler(req, res);
    case '/api/auth/me':
      return meHandler(req, res);
    case '/api/users/update':
      return updateHandler(req, res);
    case '/api/orders':
      return ordersHandler(req, res);
    case '/api/users':
      return usersHandler(req, res);
    case '/api/reviews':
      return reviewsHandler(req, res);
    default:
      return res.status(404).json({ error: 'API JSON Route Not Found', path: url });
  }
}
