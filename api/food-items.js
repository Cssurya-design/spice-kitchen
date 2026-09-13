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
    jwt.verify(token, JWT_SECRET);
    return true; 
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { category } = req.query;
      let sql = 'SELECT * FROM food_items';
      let args = [];
      if (category) {
        sql += ' WHERE category_id = ?';
        args.push(category);
      }
      sql += ' ORDER BY id DESC';
      const rs = await client.execute({ sql, args });
      // SQLite booleans are 0/1. We map them to true/false for frontend
      const items = rs.rows.map(row => ({
        ...row,
        is_veg: Boolean(row.is_veg),
        is_available: Boolean(row.is_available)
      }));
      return res.status(200).json(items);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Form parsing error' });
      
      const getField = (name) => Array.isArray(fields[name]) ? fields[name][0] : fields[name];
      
      const name = getField('name');
      const description = getField('description');
      const price = parseFloat(getField('price'));
      const category_id = parseInt(getField('category'));
      const is_veg = getField('is_veg') === 'true' || getField('is_veg') === '1' ? 1 : 0;
      const is_available = getField('is_available') !== 'false' && getField('is_available') !== '0' ? 1 : 0;
      
      let image_url = '';
      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      
      try {
        if (imageFile) {
          const result = await cloudinary.uploader.upload(imageFile.filepath, { folder: 'spice_kitchen/food' });
          image_url = result.secure_url;
        }

        const rs = await client.execute({
          sql: `INSERT INTO food_items (name, description, price, image_url, category_id, is_veg, is_available) 
                VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          args: [name, description || '', price, image_url, category_id, is_veg, is_available]
        });
        
        const row = rs.rows[0];
        row.is_veg = Boolean(row.is_veg);
        row.is_available = Boolean(row.is_available);
        return res.status(201).json(row);
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: 'Database or Upload error' });
      }
    });
    return;
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Form parsing error' });
      
      const getField = (name) => Array.isArray(fields[name]) ? fields[name][0] : fields[name];
      
      const id = req.query.id || getField('id');
      if (!id) return res.status(400).json({ error: 'ID required' });

      try {
        const existingRs = await client.execute({ sql: 'SELECT * FROM food_items WHERE id = ?', args: [id] });
        if (existingRs.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const item = existingRs.rows[0];

        const name = getField('name') || item.name;
        const description = getField('description') !== undefined ? getField('description') : item.description;
        const price = getField('price') ? parseFloat(getField('price')) : item.price;
        const category_id = getField('category') ? parseInt(getField('category')) : item.category_id;
        const is_veg = getField('is_veg') !== undefined ? (getField('is_veg') === 'true' || getField('is_veg') === '1' ? 1 : 0) : item.is_veg;
        const is_available = getField('is_available') !== undefined ? (getField('is_available') === 'true' || getField('is_available') === '1' ? 1 : 0) : item.is_available;
        
        let image_url = item.image_url;
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
        if (imageFile) {
          const result = await cloudinary.uploader.upload(imageFile.filepath, { folder: 'spice_kitchen/food' });
          image_url = result.secure_url;
        }

        const rs = await client.execute({
          sql: `UPDATE food_items SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, is_veg = ?, is_available = ? WHERE id = ? RETURNING *`,
          args: [name, description, price, image_url, category_id, is_veg, is_available, id]
        });

        const row = rs.rows[0];
        row.is_veg = Boolean(row.is_veg);
        row.is_available = Boolean(row.is_available);
        return res.status(200).json(row);
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: 'Database or Upload error' });
      }
    });
    return;
  }

  if (req.method === 'DELETE') {
    if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    
    try {
      await client.execute({ sql: 'DELETE FROM food_items WHERE id = ?', args: [id] });
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
