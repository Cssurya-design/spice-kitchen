import { useState, useEffect } from 'react'
import { Store, Clock, Truck, MapPin, Save, Loader } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useSettings } from '../../contexts/SettingsContext'
import './Settings.css'

export default function Settings() {
  const { fetchSettings: fetchGlobalSettings } = useSettings()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data } = await api.get('settings')
      if (data && data.length > 0) {
        setSettings(data[0])
      } else {
        const { data: newData } = await api.post('settings', {})
        setSettings(newData)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...settings }
      delete payload.logo_url // Cannot be patched as a string URL

      // Convert empty numeric fields to null where applicable
      if (payload.lat === '') payload.lat = null
      if (payload.lng === '') payload.lng = null
      if (payload.delivery_radius_km === '') payload.delivery_radius_km = 0
      if (payload.delivery_fee === '') payload.delivery_fee = 0
      if (payload.min_order_amount === '') payload.min_order_amount = 0
      if (payload.free_delivery_above === '') payload.free_delivery_above = 0
      if (payload.gst_percentage === '') payload.gst_percentage = 0

      await api.patch(`settings/${settings.id}/`, payload)
      toast.success('Settings saved!')
      fetchGlobalSettings()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <h2 className="page-title">Hotel Settings</h2>
        <div className="settings-loading">Loading...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="settings-page">
        <h2 className="page-title">Hotel Settings</h2>
        <p>Unable to load settings. Please check server connection.</p>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2 className="page-title">Hotel Settings</h2>
        <button className="save-settings-btn" onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-grid">
        {/* Basic Info */}
        <div className="settings-card">
          <h3><Store size={18} /> Basic Information</h3>
          <div className="settings-fields">
            <div className="s-field">
              <label>Hotel Name</label>
              <input name="hotel_name" value={settings.hotel_name || ''} onChange={handleChange} />
            </div>
            <div className="s-field full">
              <label>Description</label>
              <textarea name="description" value={settings.description || ''} onChange={handleChange} rows={3} />
            </div>
            <div className="s-field">
              <label>Phone</label>
              <input name="phone" value={settings.phone || ''} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label>Email</label>
              <input name="email" value={settings.email || ''} onChange={handleChange} type="email" />
            </div>
            <div className="s-field full">
              <label>Address</label>
              <input name="address" value={settings.address || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="settings-card">
          <h3><Clock size={18} /> Operating Hours</h3>
          <div className="settings-fields">
            <div className="s-field">
              <label>Opening Time</label>
              <input name="opening_time" type="time" value={settings.opening_time || '09:00'} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label>Closing Time</label>
              <input name="closing_time" type="time" value={settings.closing_time || '23:00'} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label className="toggle-label">
                <span>Restaurant is Open</span>
                <input type="checkbox" name="is_open" checked={settings.is_open || false} onChange={handleChange} />
                <span className="toggle-switch" />
              </label>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="settings-card">
          <h3><Truck size={18} /> Delivery Settings</h3>
          <div className="settings-fields">
            <div className="s-field">
              <label>Delivery Radius (km)</label>
              <input name="delivery_radius_km" type="number" step="0.5" value={settings.delivery_radius_km || 10} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label>Delivery Fee (₹)</label>
              <input name="delivery_fee" type="number" value={settings.delivery_fee || 40} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label>Min. Order Amount (₹)</label>
              <input name="min_order_amount" type="number" value={settings.min_order_amount || 99} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label>Free Delivery Above (₹)</label>
              <input name="free_delivery_above" type="number" value={settings.free_delivery_above || 499} onChange={handleChange} />
            </div>
            <div className="s-field">
              <label>GST Percentage (%)</label>
              <input name="gst_percentage" type="number" step="0.01" value={settings.gst_percentage || 5} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="settings-card">
          <h3><MapPin size={18} /> Hotel Location</h3>
          <div className="settings-fields">
            <div className="s-field">
              <label>Latitude</label>
              <input name="lat" type="number" step="0.0000001" value={settings.lat || ''} onChange={handleChange} placeholder="12.9716" />
            </div>
            <div className="s-field">
              <label>Longitude</label>
              <input name="lng" type="number" step="0.0000001" value={settings.lng || ''} onChange={handleChange} placeholder="77.5946" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
