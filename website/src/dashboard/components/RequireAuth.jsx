import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectIsAuthenticated } from '../store/authSlice'

export default function RequireAuth({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  const location = useLocation()
  if (!isAuth) {
    return <Navigate to="/dashboard/login" replace state={{ from: location }} />
  }
  return children
}
