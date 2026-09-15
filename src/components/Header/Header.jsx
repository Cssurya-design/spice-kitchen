import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, LogOut, MapPin, Search, Menu, X, ChefHat, LayoutDashboard, Package } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import toast from 'react-hot-toast'
import './Header.css'

export default function Header() {
  const { user, profile, updateProfile, displayName, avatarUrl, signOut, isAdmin } = useAuth()
  const { totalItems, clearCart } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [savedLocation, setSavedLocation] = useState(localStorage.getItem('spice_kitchen_location') || '')
  const [locationForm, setLocationForm] = useState({
    street: '', area: '', city: '', state: '', pincode: ''
  })
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)

  // Initialize location from profile if available
  useEffect(() => {
    if (profile?.saved_addresses?.length > 0) {
      const addr = profile.saved_addresses[0]
      setLocationForm({
        street: addr.street || '',
        area: addr.area || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || ''
      })
      const formatted = [addr.street, addr.city].filter(Boolean).join(', ')
      if (formatted) setSavedLocation(formatted)
    } else {
      const local = localStorage.getItem('spice_kitchen_location')
      if (local && !locationForm.street) {
        setLocationForm(prev => ({ ...prev, street: local }))
      }
    }
  }, [profile])

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false)
     
    setProfileOpen(false)
  }, [location])

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  async function handleSaveLocation(e) {
    e.preventDefault()
    if (!locationForm.street || !locationForm.city) {
      toast.error('Street and City are required')
      return
    }

    const formatted = [locationForm.street, locationForm.city].filter(Boolean).join(', ')
    setSavedLocation(formatted)
    localStorage.setItem('spice_kitchen_location', formatted)
    setLocationModalOpen(false)
    toast.success('Location updated')

    // Sync to profile if logged in
    if (user) {
      try {
        const currentAddresses = profile?.saved_addresses || []
        let newAddresses = [...currentAddresses]
        if (newAddresses.length > 0) {
          newAddresses[0] = locationForm // Update existing first address
        } else {
          newAddresses = [locationForm]
        }
        await updateProfile({ saved_addresses: newAddresses })
      } catch (error) {
      console.error('Failed to sync location to profile', error)
    }
    }
  }

  async function handleSignOut() {
    await signOut()
    clearCart()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <ChefHat size={32} strokeWidth={2.5} />
          <div className="logo-text">
            <span className="logo-name">Spice</span>
            <span className="logo-accent">Kitchen</span>
          </div>
        </Link>

        {/* Location Button (desktop) */}
        <button className="header-location-btn" onClick={() => setLocationModalOpen(true)}>
          <MapPin size={18} />
          <span className="location-text">
            {savedLocation ? (savedLocation.length > 20 ? savedLocation.substring(0, 20) + '...' : savedLocation) : 'Add Location'}
          </span>
        </button>

        {/* Location Modal */}
        {locationModalOpen && (
          <div className="location-modal-overlay" onClick={() => setLocationModalOpen(false)}>
            <div className="location-modal" onClick={e => e.stopPropagation()}>
              <div className="location-modal-header">
                <h3>Delivery Location</h3>
                <button className="close-btn" onClick={() => setLocationModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveLocation} className="location-modal-form full-form">
                <input
                  type="text"
                  placeholder="Street / House No. *"
                  value={locationForm.street}
                  onChange={(e) => setLocationForm({ ...locationForm, street: e.target.value })}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Area / Locality"
                  value={locationForm.area}
                  onChange={(e) => setLocationForm({ ...locationForm, area: e.target.value })}
                />
                <div className="loc-row">
                  <input
                    type="text"
                    placeholder="City *"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={locationForm.pincode}
                    onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })}
                  />
                </div>
                <button type="submit" className="save-location-btn">Confirm Location</button>
              </form>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/menu" className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}>
            Menu
          </Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
            About Us
          </Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
            Contact
          </Link>
          {user && (
            <Link to="/my-orders" className={`nav-link ${location.pathname === '/my-orders' ? 'active' : ''}`}>
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/dashboard" className="nav-link admin-link">
              <LayoutDashboard size={16} /> Admin
            </Link>
          )}

          {/* Mobile-only auth links */}
          <div className="mobile-auth">
            {user ? (
              <>
                <Link to="/profile" className="nav-link">Profile</Link>
                <button onClick={handleSignOut} className="nav-link sign-out-link">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" className="nav-link login-link-mobile">Sign In</Link>
            )}
          </div>
        </nav>

        {/* Right Section */}
        <div className="header-actions">
          {/* Cart */}
          <Link to="/cart" className="cart-btn" aria-label="View cart">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </Link>

          {/* Profile / Login */}
          {user ? (
            <div className="profile-dropdown" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Profile menu"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="avatar-img" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar-placeholder">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{displayName}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} /> My Profile
                  </Link>
                  <Link to="/my-orders" className="dropdown-item">
                    <Package size={16} /> My Orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="dropdown-item">
                      <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button onClick={handleSignOut} className="dropdown-item sign-out">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="login-btn">
              Sign In
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  )
}
