import { useState, useEffect } from 'react'
import { Users as UsersIcon, Mail, Phone, Calendar, Eye, X, MapPin } from 'lucide-react'
import api from '../../lib/api'
import './Users.css'

export default function Users() {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        api.get('users'),
        api.get('orders')
      ])
      
      setUsers(usersRes.data || [])
      setOrders(ordersRes.data || [])
    } catch (error) {
      console.error('Error fetching users/orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats for each user based on orders
  const usersWithStats = users.map(user => {
    const userOrders = orders.filter(o => o.user_id === user.id || o.user === user.id)
    return {
      ...user,
      totalOrders: userOrders.length,
      totalSpent: userOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    }
  })

  return (
    <div className="users-page">
      <h2 className="page-title">Registered Users</h2>

      <div className="users-list-card">
        {loading ? (
          <div className="empty-state">
            <p>Loading users...</p>
          </div>
        ) : usersWithStats.length === 0 ? (
          <div className="empty-state">
            <UsersIcon size={48} strokeWidth={1.5} />
            <p>No registered users yet</p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-head">
              <span>Name</span>
              <span>Contact</span>
              <span>Orders</span>
              <span>Total Spent</span>
              <span>Joined</span>
              <span>Action</span>
            </div>
            
            {usersWithStats.map(user => (
              <div key={user.id} className="table-row">
                <div className="user-name-col">
                  <div className="user-avatar">
                    {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-name-info">
                    <strong>{user.first_name} {user.last_name}</strong>
                    <span className="user-role">{user.is_superuser ? 'Admin' : 'Customer'}</span>
                  </div>
                </div>
                
                <div className="user-contact-col">
                  <span><Mail size={12} /> {user.email || 'N/A'}</span>
                  {user.profile?.phone && <span><Phone size={12} /> {user.profile.phone}</span>}
                </div>
                
                <div className="user-orders-col">
                  {user.totalOrders}
                </div>
                
                <div className="user-spent-col">
                  ₹{user.totalSpent.toFixed(0)}
                </div>
                
                <div className="user-date-col">
                  {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                </div>
                
                <div className="user-action-col">
                  <button className="view-user-btn" onClick={() => setSelectedUser(user)}>
                    <Eye size={16} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-modal" onClick={e => e.stopPropagation()}>
            <div className="user-modal-header">
              <h3>Customer Details</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="user-modal-body">
              <div className="um-detail">
                <span>Name</span>
                <p>{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
              <div className="um-detail">
                <span>Email</span>
                <p>{selectedUser.email}</p>
              </div>
              <div className="um-detail">
                <span>Phone</span>
                <p>{selectedUser.profile?.phone || 'N/A'}</p>
              </div>
              <div className="um-detail">
                <span>Joined Date</span>
                <p>{selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="um-detail">
                <span>Total Orders</span>
                <p>{selectedUser.totalOrders}</p>
              </div>
              <div className="um-detail">
                <span>Total Spent</span>
                <p>₹{selectedUser.totalSpent.toFixed(0)}</p>
              </div>
              
              <div className="um-addresses">
                <h4>Saved Addresses</h4>
                {selectedUser.profile?.saved_addresses && selectedUser.profile.saved_addresses.length > 0 ? (
                  selectedUser.profile.saved_addresses.map((addr, idx) => (
                    <div key={idx} className="um-addr-item">
                      <MapPin size={14} />
                      <span>{[addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-addr">No addresses saved</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
