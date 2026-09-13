import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Leaf } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import './Add.css'

const Add = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_veg: true,
    is_available: true,
  })

  useEffect(() => {
    fetchCategoriesAndItem()
  }, [id])

  async function fetchCategoriesAndItem() {
    try {
      const { data: cats } = await api.get('categories')
      setCategories(cats || [])
      
      if (id) {
        // Fetch item for editing
        const { data: item } = await api.get(`food-items?id=${id}`)
        setData({
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: item.category || (cats && cats.length > 0 ? cats[0].id : ''),
          is_veg: item.is_veg,
          is_available: item.is_available,
        })
        if (item.image_url) {
          setImagePreview(item.image_url)
        }
      } else if (cats && cats.length > 0) {
        setData(prev => ({ ...prev, category_id: cats[0].id }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    }
  }

  function onChangeHandler(e) {
    const { name, value, type, checked } = e.target
    setData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function onSubmitHandler(e) {
    e.preventDefault()
    if (!image && !isEditing) {
      toast.error('Please select an image')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('price', data.price)
      formData.append('is_veg', data.is_veg)
      formData.append('is_available', data.is_available)
      if (data.category_id) {
        formData.append('category', data.category_id)
      }
      if (image) {
        formData.append('image_url', image)
      }

      if (isEditing) {
        await api.patch(`food-items?id=${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Food item updated successfully!')
        navigate('/admin/list')
      } else {
        await api.post('food-items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Food item added successfully!')
        setData({
          name: '',
          description: '',
          price: '',
          category_id: categories[0]?.id || '',
          is_veg: true,
          is_available: true,
        })
        setImage(null)
        setImagePreview(null)
      }
    } catch (error) {
      console.error('Error saving food item:', error)
      toast.error(error.message || 'Error saving food item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add">
      <h2 className="page-title">{isEditing ? 'Edit Food Item' : 'Add New Food Item'}</h2>
      <form className="add-form" onSubmit={onSubmitHandler}>
        <div className="form-group upload-img">
          <p>Upload Image</p>
          <label htmlFor="image" className="image-label">
            {imagePreview ? (
              <img src={imagePreview} alt="preview" />
            ) : (
              <div className="upload-placeholder">
                <Upload size={36} />
                <span>Click to upload</span>
              </div>
            )}
          </label>
          <input onChange={handleImageChange} type="file" id="image" accept="image/*" hidden required />
        </div>

        <div className="form-group">
          <label>Product Name</label>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="e.g., Chicken Biryani"
            required
          />
        </div>

        <div className="form-group">
          <label>Product Description</label>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="4"
            placeholder="Describe the dish..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select onChange={onChangeHandler} value={data.category_id} name="category_id">
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Price (₹)</label>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type="number"
              name="price"
              placeholder="₹199"
              required
              min="1"
            />
          </div>
        </div>

        <div className="form-row toggles-row">
          <label className="toggle-field">
            <input type="checkbox" name="is_veg" checked={data.is_veg} onChange={onChangeHandler} />
            <span className="toggle-switch" />
            <span className="toggle-text"><Leaf size={14} /> Vegetarian</span>
          </label>

          <label className="toggle-field">
            <input type="checkbox" name="is_available" checked={data.is_available} onChange={onChangeHandler} />
            <span className="toggle-switch" />
            <span className="toggle-text">Available</span>
          </label>
        </div>

        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'ADD')}
        </button>
      </form>
    </div>
  )
}

export default Add
