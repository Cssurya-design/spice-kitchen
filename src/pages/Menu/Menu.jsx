import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Leaf, X } from 'lucide-react'
import api from '../../lib/api'
import FoodCard from '../../components/FoodCard/FoodCard'
import './Menu.css'

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [vegOnly, setVegOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [activeCategory, searchQuery, vegOnly, sortBy])

  async function fetchCategories() {
    try {
      const { data } = await api.get('categories')
      setCategories(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchItems() {
    setLoading(true)
    try {
      const { data } = await api.get('food-items')
      let filtered = data.filter(item => item.is_available)

      if (activeCategory !== 'All') {
        const cat = categories.find(c => c.name === activeCategory)
        if (cat) {
          filtered = filtered.filter(item => item.category === cat.id)
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.description && item.description.toLowerCase().includes(query))
        )
      }

      if (vegOnly) {
        filtered = filtered.filter(item => item.is_veg)
      }

      switch (sortBy) {
        case 'price-low':
          filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
          break
        case 'price-high':
          filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
          break
        case 'rating':
          filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
          break
        default:
          filtered.sort((a, b) => a.name.localeCompare(b.name))
      }

      setItems(filtered || [])
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCategoryClick(catName) {
    setActiveCategory(catName)
    if (catName === 'All') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', catName)
    }
    setSearchParams(searchParams)
  }

  function handleSearch(e) {
    const value = e.target.value
    setSearchQuery(value)
    if (value) {
      searchParams.set('search', value)
    } else {
      searchParams.delete('search')
    }
    setSearchParams(searchParams)
  }

  function clearSearch() {
    setSearchQuery('')
    searchParams.delete('search')
    setSearchParams(searchParams)
  }

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>Our Menu</h1>
        <p>Explore our full range of authentic Indian dishes</p>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={handleSearch}
            id="menu-search"
          />
          {searchQuery && (
            <button className="clear-search" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filter-controls">
          <button
            className={`veg-toggle ${vegOnly ? 'active' : ''}`}
            onClick={() => setVegOnly(!vegOnly)}
          >
            <Leaf size={16} />
            Veg Only
          </button>

          <div className="sort-select">
            <SlidersHorizontal size={16} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="menu-sort">
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        <button
          className={`cat-tab ${activeCategory === 'All' ? 'active' : ''}`}
          onClick={() => handleCategoryClick('All')}
        >
          🍽️ All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-tab ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="food-grid">
          {Array.from({ length: 8 }).map((_, i) => (
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
      ) : items.length > 0 ? (
        <>
          <p className="results-count">{items.length} dish{items.length !== 1 ? 'es' : ''} found</p>
          <div className="food-grid">
            {items.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : (
        <div className="no-results">
          <span className="no-results-icon">🔍</span>
          <h3>No dishes found</h3>
          <p>Try changing your search or filters</p>
          <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); setVegOnly(false); }} className="reset-filters-btn">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}
