import { useState } from 'react'
import { Gift, Loader, Users, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import './Offers.css'

export default function Offers() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSendOffer(e) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required')
      return
    }

    const confirmSend = window.confirm('Are you sure you want to send this offer to ALL registered users? This action cannot be undone.')
    if (!confirmSend) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('message', message)
      if (image) {
        formData.append('image', image)
      }

      const { data } = await api.post('users/send_offer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(data.message || 'Offers sent successfully!')
      setSubject('')
      setMessage('')
      setImage(null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send offers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="offers-page">
      <div className="offers-header">
        <h2 className="page-title"><Gift size={24} /> Send Offers</h2>
        <p>Send a promotional email to all your registered customers.</p>
      </div>

      <div className="offers-container">
        <div className="offers-card">
          <div className="offers-info">
            <Users size={20} className="info-icon" />
            <p>This email will be sent to <strong>all</strong> users who have created an account.</p>
          </div>

          <form onSubmit={handleSendOffer} className="offers-form">
            <div className="form-group">
              <label>Email Subject</label>
              <input 
                type="text" 
                placeholder="e.g. 50% OFF Weekend Special! 🌶️" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Message</label>
              <textarea 
                rows="8" 
                placeholder="Write your promotional message here. You can use line breaks to format your text."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Offer Poster / Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImage(e.target.files[0])
                  }
                }}
                className="file-input"
              />
              {image && <p className="file-name">Selected: {image.name}</p>}
            </div>

            <button type="submit" className="send-offer-btn" disabled={loading}>
              {loading ? (
                <><Loader size={18} className="spin" /> Sending to all users...</>
              ) : (
                <><Send size={18} /> Send Offer Now</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
