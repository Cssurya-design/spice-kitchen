import { IncomingForm } from 'formidable';
import cloudinary from '../lib/cloudinary.js';
import { client } from '../lib/db.js';
import jwt from 'jsonwebtoken';

export const config = {
  api: { bodyParser: false } // Required for formidable
};

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authData = authenticate(req);
  if (!authData) return res.status(401).json({ error: 'Unauthorized' });

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form' });

    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
    if (!avatarFile) return res.status(400).json({ error: 'No avatar file provided' });

    try {
      const result = await cloudinary.uploader.upload(avatarFile.filepath, {
        folder: 'spice_kitchen/avatars'
      });

      const avatar_url = result.secure_url;

      await client.execute({
        sql: 'UPDATE users SET avatar_url = ? WHERE id = ?',
        args: [avatar_url, authData.id]
      });

      res.status(200).json({ success: true, avatar_url });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
}
