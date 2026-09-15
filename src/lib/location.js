/**
 * Location utilities for GPS-based address detection
 * Uses Browser Geolocation API + OpenStreetMap Nominatim (free, no API key)
 */

/**
 * Get current GPS coordinates from browser
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        let message = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable it in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out.'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  })
}

/**
 * Reverse geocode coordinates to get address
 * Uses OpenStreetMap Nominatim (free, no API key needed)
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object>} Address components
 */
export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    )

    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    return {
      fullAddress: data.locality || data.city || data.principalSubdivision || '',
      street: '', // BigDataCloud free tier doesn't always provide street
      area: data.locality || '',
      city: data.city || data.locality || '',
      state: data.principalSubdivision || '',
      pincode: data.postcode || '',
      country: data.countryName || 'India',
      lat,
      lng,
    }
  } catch (error) {
      console.error('Reverse geocoding error:', error)
    throw error
    }
}

/**
 * Get full address with GPS auto-detection
 * @returns {Promise<Object>} Complete address object
 */
export async function getLocationAddress() {
  const coords = await getCurrentLocation()
  const address = await reverseGeocode(coords.lat, coords.lng)
  return address
}

/**
 * Format address object to display string
 * @param {Object} address
 * @returns {string}
 */
export function formatAddress(address) {
  if (!address) return ''
  const parts = [
    address.street,
    address.area,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean)
  return parts.join(', ')
}
