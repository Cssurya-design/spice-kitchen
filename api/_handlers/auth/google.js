import { client } from '../lib/db.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const { tokens } = await oAuth2Client.getToken(token);
    const idToken = tokens.id_token;
    
    const ticket = await oAuth2Client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, given_name, family_name, picture } = payload;

    // Check if user exists
    let rs = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    let user;
    if (rs.rows.length === 0) {
      // Create user
      const id = crypto.randomUUID();
      await client.execute({
        sql: `INSERT INTO users (id, email, first_name, last_name, avatar_url, role)
              VALUES (?, ?, ?, ?, ?, 'customer')`,
        args: [id, email, given_name || '', family_name || '', picture || '']
      });
      user = { id, email, role: 'customer' };
    } else {
      user = rs.rows[0];
    }

    const access = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const refresh = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ access, refresh });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
