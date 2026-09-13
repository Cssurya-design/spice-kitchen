import { useState, useEffect } from 'react'
import { Trash2, Eye, EyeOff, Leaf, Edit2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import './List.css'

const List = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchList = async () => {
    try {
      const { data } = await api.get('food-items')
      setList(data || [])
    } catch (error) {
      console.error('Error fetching food list:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFood = async (foodId) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.delete(`food-items?id=${foodId}`)
      setList(prev => prev.filter(item => item.id !== foodId))
      toast.success('Item removed!')
    } catch (error) {
      toast.error('Error removing item')
    }
  }

  const toggleAvailability = async (item) => {
    try {
      await api.patch(`food-items?id=${item.id}`, { is_available: !item.is_available })
      setList(prev =>
        prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
      )
      toast.success(item.is_available ? 'Item hidden from menu' : 'Item visible on menu')
    } catch (error) {
      toast.error('Error updating item')
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div className="list">
      <h2 className="page-title">All Food Items</h2>
      <div className="list-table">
        <div className="list-table-header">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Type</b>
          <b>Status</b>
          <b>Action</b>
        </div>
        {loading ? (
          <div className="empty-state">
            <p>Loading items...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p>No food items yet. Add your first item!</p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className={`list-table-row ${!item.is_available ? 'unavailable' : ''}`}>
              <div className="list-img-wrap">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className="list-img-placeholder">🍽️</div>
                )}
              </div>
              <p className="item-name">{item.name}</p>
              <p className="category-badge">{item.category_details?.name || '—'}</p>
              <p className="price">₹{Number(item.price).toFixed(0)}</p>
              <span className={`type-badge ${item.is_veg ? 'veg' : 'non-veg'}`}>
                {item.is_veg ? <><Leaf size={12} /> Veg</> : '● Non-Veg'}
              </span>
              <button
                onClick={() => toggleAvailability(item)}
                className={`availability-btn ${item.is_available ? 'available' : 'hidden-item'}`}
                title={item.is_available ? 'Click to hide' : 'Click to show'}
              >
                {item.is_available ? <><Eye size={14} /> Active</> : <><EyeOff size={14} /> Hidden</>}
              </button>
              <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to={`/admin/edit/${item.id}`}
                  className="edit-btn"
                  title="Edit item"
                  style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '5px' }}
                >
                  <Edit2 size={16} />
                </Link>
                <button
                  onClick={() => removeFood(item.id)}
                  className="delete-btn"
                  title="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default List
