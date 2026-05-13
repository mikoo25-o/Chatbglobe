import { create } from 'zustand'

import api from '../lib/api'
import { disconnectSocket } from '../lib/socket'

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const stored =
        localStorage.getItem(
          'transmsg_user'
        )

      return stored
        ? JSON.parse(stored)
        : null
    } catch {
      return null
    }
  })(),

  token:
    localStorage.getItem(
      'transmsg_token'
    ) || null,

  loading: false,
  error: null,

  //
  // LOGIN
  //
  login: async (email, password) => {
    set({
      loading: true,
      error: null
    })

    try {
      const { data } = await api.post(
        '/auth/login',
        {
          email,
          password
        }
      )

      localStorage.setItem(
        'transmsg_token',
        data.token
      )

      localStorage.setItem(
        'transmsg_user',
        JSON.stringify(data.user)
      )

      set({
        user: data.user,
        token: data.token,
        loading: false
      })

      return {
        success: true
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Login failed'

      set({
        error: msg,
        loading: false
      })

      return {
        success: false,
        error: msg
      }
    }
  },

  //
  // REGISTER
  //
  register: async (formData) => {
    set({
      loading: true,
      error: null
    })

    try {
      const { data } = await api.post(
        '/auth/register',
        formData
      )

      localStorage.setItem(
        'transmsg_token',
        data.token
      )

      localStorage.setItem(
        'transmsg_user',
        JSON.stringify(data.user)
      )

      set({
        user: data.user,
        token: data.token,
        loading: false
      })

      return {
        success: true
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Registration failed'

      set({
        error: msg,
        loading: false
      })

      return {
        success: false,
        error: msg
      }
    }
  },

  //
  // LOGOUT
  //
  logout: () => {
    disconnectSocket()

    localStorage.removeItem(
      'transmsg_token'
    )

    localStorage.removeItem(
      'transmsg_user'
    )

    set({
      user: null,
      token: null
    })
  },

  //
  // UPDATE USER
  //
  updateUser: (updates) => {
    const updated = {
      ...get().user,
      ...updates
    }

    localStorage.setItem(
      'transmsg_user',
      JSON.stringify(updated)
    )

    set({
      user: updated
    })
  }
}))