import { client } from './lib/db.js';
import jwt from 'jsonwebtoken';
import { IncomingForm } from 'formidable';
import cloudinary from './lib/cloudinary.js';

export const config = { api: { bodyParser: false } };

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

function authenticateAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // In a real app, query DB to ensure user is still admin. Assuming token is valid.
    return true; 
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rs = await client.execute('SELECT * FROM categories ORDER BY sort_order ASC, id DESC');
      return res.status(200).json(rs.rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Form parsing error' });
      
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      const icon = Array.isArray(fields.icon) ? fields.icon[0] : fields.icon;
      
      try {
        const rs = await client.execute({
          sql: 'INSERT INTO categories (name, icon) VALUES (?, ?) RETURNING *',
          args: [name, icon || '🍽️']
        });
        return res.status(201).json(rs.rows[0]);
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: 'Database error' });
      }
    });
    return;
  }
  
  // Note: For PUT/DELETE you would typically use a dynamic route like /api/categories/[id].js
  // For simplicity, we can just handle it if they pass ?id=xx
  if (req.method === 'DELETE') {
    if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    
    try {
      await client.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
