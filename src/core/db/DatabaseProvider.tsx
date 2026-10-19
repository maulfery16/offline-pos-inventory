'use client'

import { createContext, useEffect, useState } from 'react'
import { Database } from '@nozbe/watermelondb'

export const DatabaseContext = createContext<Database | null>(null)

interface DatabaseProviderProps {
  children: React.ReactNode
}

export default function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<Database | null>(null)

  useEffect(() => {
    // Dynamically import the singleton to avoid SSR crash —
    // WatermelonDB adapters are browser-only and must not run on the server
    import('./watermelon').then((mod) => {
      setDb(mod.watermelonDB)
    })
  }, [])

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  )
}
