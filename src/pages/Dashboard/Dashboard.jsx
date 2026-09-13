import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, IndianRupee, TrendingUp, Clock, ShoppingBag, ArrowRight } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalItems: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [allOrders, foodItems] = await Promise.all([
        api.get('orders'),
        api.get('food-items'),
      ])

      const orders = allOrders.data || []
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today)

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
        pendingOrders: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length,
        totalItems: (foodItems.data || []).length,
      })

      setRecentOrders(orders.slice(0, 5))
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (orderId, status) => {
    try {
      let updates = { status }
      if (status === 'Delivered') {
        updates.payment_status = true
      }
      
      await api.patch(`orders?id=${orderId}`, updates)
      setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o))
      
      // We should ideally fetchDashboardData() here to update stats, but for responsiveness we just let it be or call it.
      fetchDashboardData()
      toast.success(`Order #${orderId} updated to ${status}`)
    } catch (error) {
      toast.error('Error updating order')
    }
  }

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: Package, color: '#3b82f6' },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toFixed(0)}`, icon: IndianRupee, color: '#22c55e' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: '#FF6B35' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: '#FFB800' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#a78bfa' },
    { label: 'Menu Items', value: stats.totalItems, icon: Package, color: '#f472b6' },
  ]

  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="stat-card" style={{ '--card-color': card.color }}>
              <div className="stat-icon-wrap">
                <Icon size={22} />
              </div>
              <div>
                <p className="stat-card-value">{loading ? '—' : card.value}</p>
                <p className="stat-card-label">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="recent-section">
        <div className="recent-header">
          <h3>Recent Orders</h3>
          <Link to="/admin/orders" className="view-all-link">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="no-data">No orders yet</p>
        ) : (
          <div className="recent-table">
            <div className="table-head">
              <span>Order</span>
              <span>Items</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {recentOrders.map(order => (
              <div key={order.id} className="table-row">
                <span className="order-id-cell">
                  #{order.id} {order.address?.firstName && `- ${order.address.firstName} ${order.address.lastName || ''}`}
                </span>
                <span className="items-cell">
                  {(order.items || []).map(i => i.name).join(', ').substring(0, 40)}
                </span>
                <span className="amount-cell">₹{Number(order.total_amount).toFixed(0)}</span>
                <span className="status-cell">
                  <select
                    onChange={(e) => statusHandler(order.id, e.target.value)}
                    value={order.status}
                    className={`status-dropdown status-${order.status.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <option value="Food Processing">Food Processing</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </span>
                <span className="date-cell">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
