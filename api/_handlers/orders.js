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
  const authData = authenticate(req);
  if (!authData) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      // Check if user is admin
      const userRs = await client.execute({ sql: 'SELECT role FROM users WHERE id = ?', args: [authData.id] });
      const isAdmin = userRs.rows.length > 0 && userRs.rows[0].role === 'admin';

      let sql = 'SELECT * FROM orders ORDER BY id DESC';
      let args = [];

      if (!isAdmin) {
        sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC';
        args = [authData.id];
      }

      const rs = await client.execute({ sql, args });
      const orders = rs.rows.map(row => ({
        ...row,
        items: JSON.parse(row.items),
        address: JSON.parse(row.address),
        payment_status: Boolean(row.payment_status)
      }));
      return res.status(200).json(orders);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { items, amount, delivery_fee, total_amount, address, payment_method, notes } = req.body;
    
    try {
      const rs = await client.execute({
        sql: `INSERT INTO orders (user_id, items, amount, delivery_fee, total_amount, address, payment_method, notes) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [
          authData.id, 
          JSON.stringify(items), 
          amount, 
          delivery_fee || 40, 
          total_amount, 
          JSON.stringify(address), 
          payment_method || 'COD', 
          notes || ''
        ]
      });
      const order = rs.rows[0];
      order.items = JSON.parse(order.items);
      order.address = JSON.parse(order.address);
      order.payment_status = Boolean(order.payment_status);
      return res.status(201).json(order);
    } catch (dbErr) {
      console.error(dbErr);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    // Only admin can update order status
    try {
      const userRs = await client.execute({ sql: 'SELECT role FROM users WHERE id = ?', args: [authData.id] });
      if (userRs.rows.length === 0 || userRs.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: 'ID required' });

      const { status, payment_status } = req.body;
      
      const existingRs = await client.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
      if (existingRs.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const current = existingRs.rows[0];

      const newStatus = status || current.status;
      const newPaymentStatus = payment_status !== undefined ? (payment_status ? 1 : 0) : current.payment_status;

      const rs = await client.execute({
        sql: `UPDATE orders SET status = ?, payment_status = ? WHERE id = ? RETURNING *`,
        args: [newStatus, newPaymentStatus, id]
      });

      const order = rs.rows[0];
      order.items = JSON.parse(order.items);
      order.address = JSON.parse(order.address);
      order.payment_status = Boolean(order.payment_status);
      return res.status(200).json(order);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
