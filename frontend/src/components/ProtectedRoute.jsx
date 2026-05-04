import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

ProtectedRoute.propTypes = {
  children:     PropTypes.node.isRequired,
  requiredRole: PropTypes.string,
}

ProtectedRoute.defaultProps = {
  requiredRole: null,
}

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" replace />
  return children
}
