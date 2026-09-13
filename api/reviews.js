import { client } from './lib/db.js';
import jwt from 'jsonwebtoken';

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
  if (req.method === 'GET') {
    try {
      const rs = await client.execute('SELECT * FROM reviews ORDER BY id DESC');
      return res.status(200).json(rs.rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const authData = authenticate(req);
    if (!authData) return res.status(401).json({ error: 'Unauthorized' });

    const { food_item_id, rating, comment } = req.body;
    
    try {
      const rs = await client.execute({
        sql: `INSERT INTO reviews (user_id, food_item_id, rating, comment) VALUES (?, ?, ?, ?) RETURNING *`,
        args: [authData.id, food_item_id, rating, comment || '']
      });
      return res.status(201).json(rs.rows[0]);
    } catch (dbErr) {
      console.error(dbErr);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
