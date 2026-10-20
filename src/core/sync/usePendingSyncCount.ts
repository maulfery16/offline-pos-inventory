'use client'

import { useState, useEffect } from 'react'

const PENDING_COUNT_KEY = 'pendingSyncCount'

/**
 * Returns the number of local transactions that have not yet been synced
 * to the backend. The count is written to localStorage by useSyncManager
 * after each sync cycle, and defaults to 0 if no value is present.
 *
 * Uses the browser storage event for cross-tab reactivity.
 */
export function usePendingSyncCount(): number {
  const [count, setCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem(PENDING_COUNT_KEY) ?? '0', 10) || 0
  })

  useEffect(() => {
    // Read latest value on mount (handles cases where state was computed during SSR)
    const read = () => {
      setCount(parseInt(localStorage.getItem(PENDING_COUNT_KEY) ?? '0', 10) || 0)
    }
    read()

    // React to updates from useSyncManager (same tab or other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PENDING_COUNT_KEY) {
        setCount(parseInt(e.newValue ?? '0', 10) || 0)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return count
}
