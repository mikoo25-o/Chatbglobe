import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:4000/api',

  timeout: 15000
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('transmsg_token')

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(
      'API Error:',
      err.response?.data || err.message
    )

    return Promise.reject(err)
  }
)

export default api