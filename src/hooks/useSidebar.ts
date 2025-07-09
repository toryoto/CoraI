import { useState, useCallback } from 'react'

export function useSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
  }
} 