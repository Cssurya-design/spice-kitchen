import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
        try {
          // Verify token is still valid
          const { data } = await api.get('auth/me')
          setUser(data)
          localStorage.setItem('user', JSON.stringify(data))
        } catch (error) {
      console.error("Token verification failed", error)
          // Only sign out if it's explicitly a 401 Unauthorized (and refresh failed).
          // Do not sign out on network errors or 500s.
          if (error.response && error.response.status === 401) {
            signOut()
    }
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const signIn = async (email, password) => {
    const { data } = await api.post('auth/login', { username: email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    
    // Fetch user details
    const userRes = await api.get('auth/me')
    setUser(userRes.data)
    localStorage.setItem('user', JSON.stringify(userRes.data))
    return userRes.data
  }

  const signUp = async (email, password, firstName, lastName, phone) => {
    const { data } = await api.post('auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone
    })
    
    // After registration, sign in
    await signIn(email, password)
    return data
  }

  async function signOut() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const userId = user.id
    // map the nested structure
    const payload = {}
    if (data.first_name !== undefined) payload.first_name = data.first_name
    if (data.last_name !== undefined) payload.last_name = data.last_name
    
    if (data.phone !== undefined || data.saved_addresses !== undefined) {
      payload.profile = {}
      if (data.phone !== undefined) payload.profile.phone = data.phone
      if (data.saved_addresses !== undefined) payload.profile.saved_addresses = data.saved_addresses
    }
    
    const res = await api.patch(`users/update`, payload)
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
    return res.data
  }

  const uploadAvatar = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await api.post('users/upload_avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    // Refresh user profile
    const userRes = await api.get('auth/me')
    setUser(userRes.data)
    localStorage.setItem('user', JSON.stringify(userRes.data))
    return res.data
  }

  const signInWithGoogle = async (credential) => {
    try {
      const { data } = await api.post('auth/google', { token: credential })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      
      const { data: profileData } = await api.get('auth/me')
      setUser(profileData)
      localStorage.setItem('user', JSON.stringify(profileData))
    } catch (error) {
      console.error('Google Sign In Error:', error)
      throw error
    }
  }

  const value = {
    user,
    profile: user?.profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateProfile,
    uploadAvatar,
    isAdmin: user?.profile?.role === 'admin' || user?.is_superuser,
    displayName: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email?.split('@')[0],
    avatarUrl: user?.profile?.avatar_url
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
