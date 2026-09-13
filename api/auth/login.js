import { client } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

// Helper for checking django pbkdf2 hashes
import crypto from 'crypto';
function verifyDjangoHash(password, hash) {
  if (hash.startsWith('pbkdf2_')) {
    const parts = hash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];
    const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    return key.toString('base64') === originalHash;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const rs = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [username]
    });

    if (rs.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rs.rows[0];
    let isValid = false;

    if (user.password_hash) {
      if (user.password_hash.startsWith('pbkdf2_')) {
        isValid = verifyDjangoHash(password, user.password_hash);
      } else {
        isValid = await bcrypt.compare(password, user.password_hash);
      }
    }

    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const access = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const refresh = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ access, refresh });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
