import { client } from './lib/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

function authenticateAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    return true; 
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const rs = await client.execute('SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(rs.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
