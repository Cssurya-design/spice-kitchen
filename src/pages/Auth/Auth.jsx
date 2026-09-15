import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, Phone, Eye, EyeOff, ChefHat } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Auth() {
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, signInWithGoogle, user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const justAuthed = useRef(false)

  // Force login mode when switching to admin
  useEffect(() => {
    if (isAdminLogin) {
      setIsLogin(true)
    }
  }, [isAdminLogin])

  function handleChange(e) {
    if (e.target.name === 'phone') {
      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, phone: value });
      return;
    }
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Redirect logic
  useEffect(() => {
    if (!authLoading && user) {
      // If returning from an auth action or already logged in
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        const from = loc.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      }
    }
  }, [user, isAdmin, authLoading, navigate, loc])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.email || !form.password) {
      toast.error('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      if (isAdminLogin) {
        if (form.email !== 'admin@spicekitchen.com' || form.password !== 'admin123') {
          toast.error('Invalid admin credentials. Please use the correct admin email and password.')
          setLoading(false)
          return
        }
      }

      if (isLogin) {
        await signIn(form.email, form.password)
        justAuthed.current = true
        toast.success('Welcome back!')
      } else {
        if (!form.firstName) {
          toast.error('Please provide your first name')
          setLoading(false)
          return
        }
        if (form.password.length < 6) {
          toast.error('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        if (form.password !== form.confirmPassword) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }

        await signUp(form.email, form.password, form.firstName, form.lastName, form.phone)
        justAuthed.current = true
        toast.success('Account created!')
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        if (codeResponse.code) {
          await signInWithGoogle(codeResponse.code)
          justAuthed.current = true
          toast.success('Google Login Successful!')
        }
      } catch (err) {
        toast.error('Google sign-in failed on our server. Please try again.')
      }
    },
    onError: () => {
      toast.error('Google login was cancelled or failed.')
    }
  })

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="auth-card auth-unified-card">
        {/* Customer vs Admin Mode Toggle */}
        <div className="auth-mode-toggle">
          <button
            type="button"
            onClick={() => setIsAdminLogin(false)}
            className={`mode-btn ${!isAdminLogin ? 'active' : ''}`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setIsAdminLogin(true)}
            className={`mode-btn admin-mode ${isAdminLogin ? 'active' : ''}`}
          >
            Admin
          </button>
        </div>

        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <ChefHat size={36} />
            <span>Spice Kitchen</span>
          </Link>
          <h1>
            {isAdminLogin ? 'Admin Portal' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h1>
          <p>
            {isAdminLogin 
              ? 'Sign in to manage the restaurant' 
              : (isLogin ? 'Sign in to order your favourite food' : 'Join us and discover amazing Indian food')}
          </p>
        </div>

        {/* Login / Sign Up Toggle (Hidden in Admin Mode) */}
        {!isAdminLogin && (
          <div className="auth-action-toggle">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`action-btn ${isLogin ? 'active' : ''}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`action-btn ${!isLogin ? 'active' : ''}`}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Sign Up Fields */}
          {!isLogin && !isAdminLogin && (
            <>
              <div className="name-inputs" style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name *"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="input-group">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Mobile number (10 digits)"
                  value={form.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  minLength="10"
                />
              </div>
            </>
          )}

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email address *"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={!isLogin ? 'Password (min 6 chars) *' : 'Password *'}
              value={form.password}
              onChange={handleChange}
              required
              minLength={!isLogin ? 6 : undefined}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password Field */}
          {!isLogin && !isAdminLogin && (
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className={`auth-submit ${isAdminLogin ? 'admin-submit' : ''}`} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google OAuth */}
        <button className="google-btn" onClick={handleGoogleSignIn} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

      </div>
    </div>
  )
}
