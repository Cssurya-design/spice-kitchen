import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { Plus, Trash2, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import './Categories.css'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  const [form, setForm] = useState({
    name: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const { data } = await api.get('categories')
      setCategories(data || [])
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setAdding(true)
    try {
      await api.post('categories', { name: form.name.trim() })

      toast.success('Category added successfully')
      setForm({ name: '' })
      fetchCategories()
    } catch (error) {
      toast.error(error.message || 'Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this category? This might affect food items linked to it.')) {
      return
    }

    try {
      await api.delete(`categories?id=${id}`)
      
      toast.success('Category deleted')
      setCategories(categories.filter(c => c.id !== id))
    } catch (error) {
      toast.error('Failed to delete category')
      console.error(error)
    }
  }

  if (loading) {
    return <div className="loading">Loading categories...</div>
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h2>Manage Categories</h2>
          <p>Add or remove food categories for your menu</p>
        </div>
      </div>

      <div className="categories-content">
        {/* Add Category Form */}
        <div className="add-category-card">
          <h3>Add New Category</h3>
          <form onSubmit={handleAddCategory} className="category-form">
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Biryani"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            

            <button type="submit" className="add-btn" disabled={adding}>
              {adding ? 'Adding...' : <><Plus size={18} /> Add Category</>}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="categories-list-card">
          <h3>Current Categories ({categories.length})</h3>
          
          {categories.length === 0 ? (
            <div className="empty-state">
              <LayoutGrid size={48} />
              <p>No categories found</p>
              <span>Add your first category above</span>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map((cat) => (
                <div key={cat.id} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(cat.id)} 
                    className="delete-btn"
                    title="Delete Category"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
