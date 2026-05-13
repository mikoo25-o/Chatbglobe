import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://chatbglobe-production.up.railway.app/api',
  timeout: 15000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('transmsg_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API Error:',
      error.response?.data || error.message
    )

    return Promise.reject(error)
  }
)

export default api