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
  if (req.method !== 'PATCH' && req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authData = authenticate(req);
  if (!authData) return res.status(401).json({ error: 'Unauthorized' });

  const { first_name, last_name, profile } = req.body;

  try {
    const rs = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [authData.id]
    });

    if (rs.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rs.rows[0];

    const newFirstName = first_name !== undefined ? first_name : user.first_name;
    const newLastName = last_name !== undefined ? last_name : user.last_name;
    let newPhone = user.phone;
    let newSavedAddresses = user.saved_addresses;
    let newAvatar = user.avatar_url;

    if (profile) {
      if (profile.phone !== undefined) newPhone = profile.phone;
      if (profile.saved_addresses !== undefined) newSavedAddresses = typeof profile.saved_addresses === 'string' ? profile.saved_addresses : JSON.stringify(profile.saved_addresses);
      if (profile.avatar_url !== undefined) newAvatar = profile.avatar_url;
    }

    await client.execute({
      sql: `UPDATE users SET first_name = ?, last_name = ?, phone = ?, saved_addresses = ?, avatar_url = ? WHERE id = ?`,
      args: [newFirstName, newLastName, newPhone, newSavedAddresses, newAvatar, authData.id]
    });

    const responseData = {
      id: user.id,
      email: user.email,
      first_name: newFirstName || '',
      last_name: newLastName || '',
      is_superuser: user.role === 'admin',
      profile: {
        role: user.role,
        phone: newPhone || '',
        avatar_url: newAvatar || '',
        saved_addresses: newSavedAddresses ? JSON.parse(newSavedAddresses) : []
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
