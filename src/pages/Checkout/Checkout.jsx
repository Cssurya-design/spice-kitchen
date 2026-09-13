import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Loader, CreditCard, Banknote, ArrowLeft, CheckCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import './Checkout.css'

export default function Checkout() {
  const { cartItems, subtotal, deliveryFee, total, clearCart } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)

  // Pre-fill from profile or user
  useEffect(() => {
    if (profile || user) {
      setAddress(prev => ({
        ...prev,
        firstName: prev.firstName || user?.first_name || '',
        lastName: prev.lastName || user?.last_name || '',
        phone: (profile && profile.phone) || prev.phone || '',
      }))

      // Use saved address if available
      if (profile && profile.saved_addresses && profile.saved_addresses.length > 0) {
        const saved = profile.saved_addresses[0]
        setAddress(prev => ({
          ...prev,
          street: saved.street || '',
          area: saved.area || '',
          city: saved.city || '',
          state: saved.state || '',
          pincode: saved.pincode || '',
        }))
      } else {
        const localLocation = localStorage.getItem('spice_kitchen_location')
        if (localLocation) {
          setAddress(prev => ({
            ...prev,
            street: localLocation,
          }))
        }
      }
    }
  }, [profile, user])

  // Redirect if cart empty on initial load
  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate('/cart', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(e) {
    setAddress({ ...address, [e.target.name]: e.target.value })
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()

    if (!address.firstName || !address.phone || !address.street || !address.city) {
      toast.error('Please fill in all required address fields')
      return
    }

    if (!address.phone.match(/^[+]?[\d\s-]{10,15}$/)) {
      toast.error('Please enter a valid phone number')
      return
    }

    setPlacing(true)
    try {
      const orderData = {
        user_id: user.id,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url || null,
        })),
        amount: subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        address: {
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          street: address.street,
          area: address.area,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        payment_method: paymentMethod,
        payment_status: false,
        notes: notes || null,
        status: 'Food Processing',
      }

      const { data } = await api.post('orders', orderData)

      // Save address to profile
      if (profile) {
        const newAddr = {
          street: address.street,
          area: address.area,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        }

        await api.patch(`users/update`, {
          profile: { saved_addresses: [newAddr] }
        })
      }

      setOrderId(data.id)
      setOrderPlaced(true)
      clearCart()
      toast.success('Order placed successfully!')
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  // Order success screen
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="order-success">
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Order Placed Successfully!</h2>
          <p>Your order #{orderId} has been confirmed</p>
          <p className="success-note">You will receive updates on your order status</p>
          <div className="success-actions">
            <button onClick={() => navigate('/my-orders', { replace: true })} className="track-btn">
              Track Order
            </button>
            <button onClick={() => navigate('/menu', { replace: true })} className="continue-btn">
              Continue Ordering
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <button className="back-link" onClick={() => navigate('/cart')}>
        <ArrowLeft size={18} /> Back to Cart
      </button>

      <h1>Checkout</h1>

      <form className="checkout-layout" onSubmit={handlePlaceOrder}>
        {/* Delivery Address */}
        <div className="checkout-form">
          <div className="form-section">
            <div className="section-title-row">
              <h2><MapPin size={20} /> Delivery Address</h2>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>First Name *</label>
                <input name="firstName" value={address.firstName} onChange={handleChange} required id="checkout-firstname" />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input name="lastName" value={address.lastName} onChange={handleChange} id="checkout-lastname" />
              </div>
              <div className="form-field full">
                <label>Phone Number *</label>
                <input name="phone" value={address.phone} onChange={handleChange} required placeholder="+91 98765 43210" id="checkout-phone" />
              </div>
              <div className="form-field full">
                <label>Street Address / House No. *</label>
                <input name="street" value={address.street} onChange={handleChange} required placeholder="Enter your street address" id="checkout-street" />
              </div>
              <div className="form-field">
                <label>Area / Locality</label>
                <input name="area" value={address.area} onChange={handleChange} placeholder="Neighbourhood/Area" id="checkout-area" />
              </div>
              <div className="form-field">
                <label>City *</label>
                <input name="city" value={address.city} onChange={handleChange} required id="checkout-city" />
              </div>
              <div className="form-field">
                <label>State</label>
                <input name="state" value={address.state} onChange={handleChange} id="checkout-state" />
              </div>
              <div className="form-field">
                <label>Pincode</label>
                <input name="pincode" value={address.pincode} onChange={handleChange} placeholder="560001" id="checkout-pincode" />
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          <div className="form-section">
            <h2>Delivery Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for delivery? (e.g., Ring the bell, leave at door...)"
              rows={3}
              id="checkout-notes"
            />
          </div>

          {/* Payment Method */}
          <div className="form-section">
            <h2><CreditCard size={20} /> Payment Method</h2>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <Banknote size={20} />
                <div>
                  <span className="payment-name">Cash on Delivery</span>
                  <span className="payment-desc">Pay when your order arrives</span>
                </div>
              </label>
              <label className={`payment-option ${paymentMethod === 'Online' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="Online" checked={paymentMethod === 'Online'} onChange={() => navigate('/online-payment')} />
                <CreditCard size={20} />
                <div>
                  <span className="payment-name">Online Payment</span>
                  <span className="payment-desc">UPI, Card, Net Banking (coming soon)</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h3>Order Summary</h3>

          <div className="summary-items">
            {cartItems.map(item => (
              <div key={item.id} className="summary-item">
                <span className="si-name">{item.name} × {item.quantity}</span>
                <span className="si-price">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span className={deliveryFee === 0 ? 'free-text' : ''}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
          </div>

          <button type="submit" className="place-order-btn" disabled={placing}>
            {placing ? <span className="btn-spinner" /> : `Place Order — ₹${total.toFixed(0)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
