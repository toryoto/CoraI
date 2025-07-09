import { useState, useCallback } from 'react'

export function useSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // デフォルト幅
  const [isResizing, setIsResizing] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const openSidebar = useCallback(() => {
    setSidebarCollapsed(false)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarCollapsed(true)
  }, [])

  const startResize = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResize = useCallback(() => {
    setIsResizing(false)
  }, [])

  const updateWidth = useCallback((newWidth: number) => {
    // 最小幅と最大幅を設定
    const minWidth = 200
    const maxWidth = 600
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setSidebarWidth(clampedWidth)
  }, [])

  return {
    sidebarCollapsed,
    sidebarWidth,
    isResizing,
    setSidebarCollapsed,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    startResize,
    stopResize,
    updateWidth,
  }
}
