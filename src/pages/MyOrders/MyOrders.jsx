import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import './MyOrders.css'

const STATUS_CONFIG = {
  'Food Processing': { icon: Clock, color: '#FFB800', label: 'Food Processing' },
  'Preparing': { icon: Clock, color: '#FFB800', label: 'Preparing' },
  'Out for delivery': { icon: Truck, color: '#3b82f6', label: 'On the way' },
  'Delivered': { icon: CheckCircle, color: '#22c55e', label: 'Delivered' },
  'Cancelled': { icon: XCircle, color: '#ef4444', label: 'Cancelled' },
}

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    if (user) fetchOrders()
  }, [user])

  async function fetchOrders() {
    try {
      const { data } = await api.get('orders')
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [user])

  function toggleExpand(orderId) {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (loading) {
    return (
      <div className="my-orders-page">
        <h1>My Orders</h1>
        <div className="orders-loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="order-skeleton">
              <div className="skeleton-line w70" />
              <div className="skeleton-line w40" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="my-orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <ShoppingBag size={56} strokeWidth={1.5} />
          <h3>No orders yet</h3>
          <p>Start ordering from our delicious menu!</p>
          <Link to="/menu" className="start-ordering-btn">Browse Menu</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['Food Processing']
            const StatusIcon = statusConfig.icon
            const isExpanded = expandedOrder === order.id
            const orderItems = order.items || []
            const orderDate = new Date(order.created_at)

            return (
              <div key={order.id} className={`order-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="order-card-header" onClick={() => toggleExpand(order.id)}>
                  <div className="order-main-info">
                    <div className="order-id-date">
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">
                        {orderDate.toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {' · '}
                        {orderDate.toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="order-items-preview">
                      {orderItems.map(i => i.name).join(', ')}
                    </p>
                  </div>

                  <div className="order-right">
                    <div className="order-status-badge" style={{ color: statusConfig.color, borderColor: `${statusConfig.color}30`, background: `${statusConfig.color}12` }}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </div>
                    <span className="order-total">₹{Number(order.total_amount).toFixed(0)}</span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="order-details">
                    {/* Status Progress */}
                    {order.status !== 'Cancelled' && (
                      <div className="status-progress">
                        {['Food Processing', 'Preparing', 'Out for delivery', 'Delivered'].map((step, i) => {
                          const steps = ['Food Processing', 'Preparing', 'Out for delivery', 'Delivered']
                          const currentIdx = steps.indexOf(order.status)
                          const isActive = i <= currentIdx
                          const isCurrent = i === currentIdx

                          return (
                            <div key={step} className={`progress-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                              <div className="step-dot" />
                              <span className="step-label">{step}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Items */}
                    <div className="order-items-list">
                      <h4>Items Ordered</h4>
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="detail-item">
                          <span>{item.name} × {item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="detail-item subtotal-item">
                        <span>Subtotal</span>
                        <span>₹{Number(order.amount).toFixed(0)}</span>
                      </div>
                      <div className="detail-item">
                        <span>Delivery Fee</span>
                        <span className={Number(order.delivery_fee) === 0 ? 'free-text' : ''}>
                          {Number(order.delivery_fee) === 0 ? 'FREE' : `₹${Number(order.delivery_fee).toFixed(0)}`}
                        </span>
                      </div>
                      <div className="detail-item total-item">
                        <span>Total</span>
                        <span>₹{Number(order.total_amount).toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Address */}
                    {order.address && (
                      <div className="order-address-detail">
                        <h4>Delivery Address</h4>
                        <p>
                          {order.address.firstName} {order.address.lastName}<br />
                          {order.address.street}, {order.address.area}<br />
                          {order.address.city}, {order.address.state} {order.address.pincode}<br />
                          Phone: {order.address.phone}
                        </p>
                      </div>
                    )}

                    <div className="order-meta-info">
                      <span>Payment: {order.payment_method || 'COD'}</span>
                      <span>Status: {order.payment_status ? '✅ Paid' : '⏳ Pending'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
