import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Star, Clock, Truck, ShieldCheck, ChefHat, MessageSquare } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import toast from 'react-hot-toast'
import FoodCard from '../../components/FoodCard/FoodCard'
import './Home.css'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [reviews, setReviews] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [allFoodItems, setAllFoodItems] = useState([])
  const navigate = useNavigate()
  
  const { user } = useAuth()
  const { addToCart } = useCart()
  const searchWrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [catRes, foodRes, reviewRes] = await Promise.all([
        api.get('categories'),
        api.get('food-items'),
        api.get('reviews')
      ])

      setCategories(catRes.data || [])
      const availableItems = foodRes.data?.filter(item => item.is_available) || []
      setAllFoodItems(availableItems)
      setPopularItems(availableItems.slice(0, 8))
      setReviews(reviewRes.data || [])
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to submit a review')
      navigate('/auth')
      return
    }
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review comment')
      return
    }

    setSubmittingReview(true)
    try {
      const { data } = await api.post('reviews', {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        // food_item is omitted for general website review
      })
      toast.success('Thank you for your review!')
      setReviews(prev => [data, ...prev])
      setReviewForm({ rating: 5, comment: '' })
    } catch (error) {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderReviewCard = (review, idx) => (
    <div key={`${review.id}-${idx}`} className="review-card">
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
  )

  const searchResults = searchQuery.trim() 
    ? allFoodItems.filter(item => item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : []

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-particles">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`} />
            ))}
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <ChefHat size={16} />
            <span>#1 Indian Restaurant in Town</span>
          </div>
          <h1>
            Authentic <span className="gradient-text">Indian Flavours</span>
            <br />Delivered to Your Door
          </h1>
          <p className="hero-desc">
            From rich biryanis to crispy dosas, experience the taste of India 
            with fresh ingredients and traditional recipes.
          </p>

          <div className="hero-search-wrapper" ref={searchWrapperRef}>
            <form className="hero-search" onSubmit={handleSearch}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search for biryani, dosa, paneer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                id="hero-search-input"
              />
              <button type="submit">Search</button>
            </form>

            {isSearchFocused && searchQuery.trim() && searchResults.length > 0 && (
              <div className="search-overlay">
                <ul className="search-overlay-list">
                  {searchResults.map(item => (
                    <li key={item.id} className="search-overlay-item">
                      <div className="search-overlay-img-wrap">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="search-overlay-img" />
                        ) : (
                          <div className="search-overlay-img-placeholder">
                            <ChefHat size={16} />
                          </div>
                        )}
                      </div>
                      <div className="search-overlay-info">
                        <h4>{item.name}</h4>
                        <span className="price">₹{item.price}</span>
                      </div>
                      <button 
                        className="search-overlay-add-btn" 
                        onClick={(e) => {
                          e.preventDefault()
                          addToCart(item)
                          toast.success(`Added ${item.name} to cart`)
                          setSearchQuery('')
                        }}
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">500+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">50+</span>
              <span className="stat-label">Menu Items</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">4.8</span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Clock size={24} /></div>
            <h3>Fast Delivery</h3>
            <p>30-45 mins average delivery time</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><ShieldCheck size={24} /></div>
            <h3>Fresh & Hygienic</h3>
            <p>100% fresh ingredients daily</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Truck size={24} /></div>
            <h3>Free Delivery</h3>
            <p>On orders above ₹499</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Star size={24} /></div>
            <h3>Top Rated</h3>
            <p>4.8★ with 500+ reviews</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Explore Categories</h2>
            <p className="section-subtitle">What are you craving today?</p>
          </div>
          <Link to="/menu" className="see-all-link">
            View Full Menu <ArrowRight size={16} />
          </Link>
        </div>

        <div className="categories-scroll">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/menu?category=${encodeURIComponent(cat.name)}`}
              className="category-card"
            >

              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Popular Dishes</h2>
            <p className="section-subtitle">Most ordered by our customers</p>
          </div>
          <Link to="/menu" className="see-all-link">
            See All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="food-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="food-card-skeleton">
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line w70" />
                  <div className="skeleton-line w40" />
                  <div className="skeleton-line w50" />
                </div>
              </div>
            ))}
          </div>
        ) : popularItems.length > 0 ? (
          <div className="food-grid">
            {popularItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <p>🍽️ Menu items coming soon! Check back later.</p>
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="section testimonials-section">
        <div className="section-header">
          <div>
            <h2>Customer Testimonials</h2>
            <p className="section-subtitle">What our customers say about us</p>
          </div>
        </div>

        <div className="testimonials-container">
          {reviews.length === 0 ? (
            <div className="empty-reviews">
              <MessageSquare size={32} />
              <p>No testimonials yet. Be the first to share your experience!</p>
            </div>
          ) : reviews.length <= 3 ? (
            <div className="reviews-grid-small" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {reviews.map((review, idx) => renderReviewCard(review, idx))}
            </div>
          ) : (
            <div className="reviews-marquee-wrapper">
              <div className="reviews-marquee">
                {[...reviews, ...reviews, ...reviews].map((review, idx) => renderReviewCard(review, idx))}
              </div>
            </div>
          )}
          
          {reviews.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <Link to="/reviews" className="login-btn-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                View All Reviews
              </Link>
            </div>
          )}

          <div className="review-form-container">
            <h3>Write a Testimonial</h3>
            {!user ? (
              <div className="login-prompt">
                <p>Please login to share your experience.</p>
                <Link to="/auth" className="login-btn-small">Login</Link>
              </div>
            ) : (
              <form onSubmit={submitReview} className="testimonial-form">
                <div className="rating-select">
                  <label>Rating:</label>
                  <div className="stars-input">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={24} 
                        fill={i < reviewForm.rating ? "var(--color-primary)" : "none"}
                        color={i < reviewForm.rating ? "var(--color-primary)" : "#4a5568"}
                        className="star-clickable"
                        onClick={() => setReviewForm({...reviewForm, rating: i + 1})}
                      />
                    ))}
                  </div>
                </div>
                <textarea 
                  placeholder="Tell us about your experience..." 
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                  rows={4}
                  required
                />
                <button type="submit" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Testimonial'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Ready to Order?</h2>
          <p>Browse our complete menu and get your favourite food delivered in minutes</p>
          <Link to="/menu" className="cta-btn">
            Order Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
