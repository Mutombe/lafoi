import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'lafoi.auth.v1'

const readPersisted = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const persisted = readPersisted()

const initialState = persisted || {
  access: null,
  refresh: null,
  user: null,
  sessionExpired: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { access, refresh, user } = action.payload
      if (access !== undefined) state.access = access
      if (refresh !== undefined) state.refresh = refresh
      if (user !== undefined) state.user = user
      // Any successful credential set clears the expired flag.
      state.sessionExpired = false
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ access: state.access, refresh: state.refresh, user: state.user }),
        )
      } catch {}
    },
    markSessionExpired: (state) => {
      state.sessionExpired = true
    },
    logout: (state) => {
      state.access = null
      state.refresh = null
      state.user = null
      state.sessionExpired = false
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    },
  },
})

export const { setCredentials, markSessionExpired, logout } = authSlice.actions
export default authSlice.reducer

export const selectAuth = (s) => s.auth
export const selectCurrentUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => Boolean(s.auth.access)
export const selectSessionExpired = (s) => Boolean(s.auth?.sessionExpired)
