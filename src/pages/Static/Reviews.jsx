import React, { useState, useEffect } from 'react'
import api from '../../lib/api'
import { Star, MessageSquare } from 'lucide-react'
import '../Home/Home.css' // Reuse Home's review card styles
import './Static.css'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const { data } = await api.get('reviews')
        setReviews(data || [])
      } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [])

  return (
    <div className="static-page">
      <h1>Customer Reviews</h1>
      <p>See what our beloved customers are saying about Spice Kitchen.</p>

      {loading ? (
        <p style={{ marginTop: '20px' }}>Loading reviews...</p>
      ) : (
        <div className="reviews-list" style={{ marginTop: '30px' }}>
          {reviews.length === 0 ? (
            <div className="empty-reviews" style={{ textAlign: 'center', padding: '40px' }}>
              <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>No testimonials yet. Be the first to share your experience!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {review.user_name ? review.user_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4>{review.user_name || 'Anonymous User'}</h4>
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < review.rating ? "var(--color-primary)" : "none"} 
                        color={i < review.rating ? "var(--color-primary)" : "#4a5568"} 
                      />
                    ))}
                  </div>
                </div>
                {review.food_item && (
                  <div className="review-food-item">
                    Ordered: <span>Item #{review.food_item}</span>
                  </div>
                )}
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
