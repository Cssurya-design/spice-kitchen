import uploadAvatarHandler from './_handlers/users/upload_avatar.js';
import categoriesHandler from './_handlers/categories.js';
import foodItemsHandler from './_handlers/food-items.js';
import settingsHandler from './_handlers/settings.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const url = req.url.split('?')[0];

  switch (url) {
    case '/api/users/upload_avatar':
      return uploadAvatarHandler(req, res);
    case '/api/categories':
      return categoriesHandler(req, res);
    case '/api/food-items':
      return foodItemsHandler(req, res);
    case '/api/settings':
      return settingsHandler(req, res);
    default:
      return res.status(404).json({ error: 'API Form Route Not Found', path: url });
  }
}
