import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refresh, JWT_SECRET);
    
    // In a real app we might check if the user still exists in DB
    const access = jwt.sign({ id: decoded.id, email: decoded.email }, JWT_SECRET, { expiresIn: '1h' });
    const newRefresh = jwt.sign({ id: decoded.id, email: decoded.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({ access, refresh: newRefresh });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
