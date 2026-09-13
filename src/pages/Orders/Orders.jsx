import { useState, useEffect } from 'react'
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import './Orders.css'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('orders')
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (orderId, updates) => {
    // Auto-mark as paid if status is changed to Delivered
    if (updates.status === 'Delivered') {
      updates.payment_status = true
    }

    try {
      await api.patch(`orders?id=${orderId}`, updates)

      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, ...updates } : o)
      )
      toast.success(`Order #${orderId} updated`)
    } catch (error) {
      toast.error('Error updating order')
    }
  }

  useEffect(() => {
    fetchOrders()
    // Polling every 30s as a fallback for realtime
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Food Processing': return <Clock size={18} className="status-icon processing" />
      case 'Preparing': return <Clock size={18} className="status-icon processing" />
      case 'Out for delivery': return <Truck size={18} className="status-icon delivery" />
      case 'Delivered': return <CheckCircle size={18} className="status-icon delivered" />
      case 'Cancelled': return <XCircle size={18} className="status-icon cancelled" />
      default: return <Package size={18} />
    }
  }

  return (
    <div className="orders">
      <h2 className="page-title">Order Management</h2>
      <div className="order-list">
        {loading ? (
          <div className="empty-state"><p>Loading orders...</p></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={48} strokeWidth={1.5} />
            <p>No orders yet</p>
          </div>
        ) : (
          orders.map((order) => {
            const items = order.items || []
            return (
              <div key={order.id} className="order-item">
                <div className="order-icon-wrap">
                  {getStatusIcon(order.status)}
                </div>
                <div className="order-details">
                  <div className="order-header">
                    <h3>Order #{order.id} {order.address?.firstName && `- ${order.address.firstName} ${order.address.lastName || ''}`}</h3>
                    <span className="order-date">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="order-items">
                    <strong>Items:</strong>
                    <p>
                      {items.map((item, i) => (
                        <span key={i}>
                          {item.name} × {item.quantity}
                          {i < items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>
                  {order.address && (
                    <div className="order-address">
                      <strong>Delivery:</strong>
                      <p>
                        {order.address.firstName} {order.address.lastName},
                        {' '}{order.address.street}, {order.address.area && `${order.address.area}, `}
                        {order.address.city}, {order.address.state} {order.address.pincode}
                      </p>
                      <p className="order-phone">📞 {order.address.phone}</p>
                    </div>
                  )}
                  <div className="order-meta">
                    <div className="order-amount">
                      <strong>Total:</strong>
                      <span className="amount">₹{Number(order.total_amount).toFixed(0)}</span>
                    </div>
                    <div className="order-payment">
                      <strong>Payment:</strong>
                      <span 
                        className={`payment-badge ${order.payment_status ? 'paid' : 'unpaid'}`}
                        onClick={() => statusHandler(order.id, { payment_status: !order.payment_status })}
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle payment status"
                      >
                        {order.payment_status ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="order-method">
                      <strong>Method:</strong>
                      <span>{order.payment_method || 'COD'}</span>
                    </div>
                  </div>
                </div>
                <div className="order-status-select">
                  <select
                    onChange={(e) => statusHandler(order.id, { status: e.target.value })}
                    value={order.status}
                    className={`status-dropdown status-${order.status.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <option value="Food Processing">Food Processing</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Orders
