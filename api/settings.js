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
      const rs = await client.execute('SELECT * FROM hotel_settings ORDER BY id ASC LIMIT 1');
      if (rs.rows.length === 0) return res.status(404).json({ error: 'Settings not found' });
      const settings = rs.rows[0];
      settings.is_open = Boolean(settings.is_open);
      return res.status(200).json(settings);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!authenticateAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Form parsing error' });
      
      const getField = (name) => Array.isArray(fields[name]) ? fields[name][0] : fields[name];

      try {
        const rs = await client.execute('SELECT * FROM hotel_settings ORDER BY id ASC LIMIT 1');
        const current = rs.rows[0] || {};
        const id = current.id || 1;

        const hotel_name = getField('hotel_name') || current.hotel_name;
        const description = getField('description') || current.description;
        const phone = getField('phone') !== undefined ? getField('phone') : current.phone;
        const email = getField('email') !== undefined ? getField('email') : current.email;
        const address = getField('address') !== undefined ? getField('address') : current.address;
        const opening_time = getField('opening_time') || current.opening_time;
        const closing_time = getField('closing_time') || current.closing_time;
        const delivery_radius_km = getField('delivery_radius_km') ? parseFloat(getField('delivery_radius_km')) : current.delivery_radius_km;
        const min_order_amount = getField('min_order_amount') ? parseFloat(getField('min_order_amount')) : current.min_order_amount;
        const delivery_fee = getField('delivery_fee') ? parseFloat(getField('delivery_fee')) : current.delivery_fee;
        const free_delivery_above = getField('free_delivery_above') ? parseFloat(getField('free_delivery_above')) : current.free_delivery_above;
        const gst_percentage = getField('gst_percentage') ? parseFloat(getField('gst_percentage')) : current.gst_percentage;
        const is_open = getField('is_open') !== undefined ? (getField('is_open') === 'true' || getField('is_open') === '1' ? 1 : 0) : current.is_open;
        
        let logo_url = current.logo_url;
        const imageFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
        if (imageFile) {
          const result = await cloudinary.uploader.upload(imageFile.filepath, { folder: 'spice_kitchen/settings' });
          logo_url = result.secure_url;
        }

        const updateSql = `
          UPDATE hotel_settings SET 
            hotel_name = ?, description = ?, logo_url = ?, phone = ?, email = ?, 
            address = ?, opening_time = ?, closing_time = ?, delivery_radius_km = ?, 
            min_order_amount = ?, delivery_fee = ?, free_delivery_above = ?, 
            gst_percentage = ?, is_open = ?
          WHERE id = ? RETURNING *
        `;
        const args = [
          hotel_name, description, logo_url, phone, email, address, opening_time, closing_time,
          delivery_radius_km, min_order_amount, delivery_fee, free_delivery_above, gst_percentage, is_open, id
        ];

        const updatedRs = await client.execute({ sql: updateSql, args });
        const updated = updatedRs.rows[0];
        updated.is_open = Boolean(updated.is_open);
        return res.status(200).json(updated);
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: 'Database or Upload error' });
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
