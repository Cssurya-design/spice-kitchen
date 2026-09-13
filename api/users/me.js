import { client } from '../lib/db.js';
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const authData = authenticate(req);
  if (!authData) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const rs = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [authData.id]
    });

    if (rs.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rs.rows[0];
    
    // Format to match old Django API expectation
    const responseData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_superuser: user.role === 'admin',
      profile: {
        role: user.role,
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        saved_addresses: user.saved_addresses ? JSON.parse(user.saved_addresses) : []
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
