import { useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import './Static.css'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', order_id: '', message: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('contact', formData)
      toast.success("Thanks for reaching out! Our team will get back to you shortly.")
      setFormData({ name: '', email: '', order_id: '', message: '' })
    } catch (error) {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="static-page">
      <h1>Contact Support</h1>
      <p>Need help with your order? Our team is available 24/7 to assist you.</p>

      <form className="support-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Your Name" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
        <input 
          type="email" 
          placeholder="Your Email Address" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required 
        />
        <input 
          type="text" 
          placeholder="Order ID (Optional)" 
          value={formData.order_id}
          onChange={(e) => setFormData({...formData, order_id: e.target.value})}
        />
        <textarea 
          rows="6" 
          placeholder="How can we help you?" 
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
