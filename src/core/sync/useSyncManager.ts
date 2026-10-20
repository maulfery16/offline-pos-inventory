'use client';

import { Database, Q } from '@nozbe/watermelondb';
import { useEffect, useState, useCallback } from 'react';
import { syncDatabase } from './index';
import Transaction from '@/core/db/models/Transaction';

async function writePendingCount(db: Database) {
  try {
    const count = await db
      .get<Transaction>('transactions')
      .query(Q.where('synced_at', null))
      .fetchCount();
    localStorage.setItem('pendingSyncCount', String(count));
  } catch {
    // non-fatal — ignore
  }
}

export default function useSyncManager(db: Database | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const triggerSync = useCallback(async () => {
    if (!db || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      await syncDatabase(db);
      setLastSyncAt(new Date());
      localStorage.setItem('lastSyncAt', new Date().toISOString());
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Sync failed';
      setSyncError(message);
    } finally {
      setIsSyncing(false);
      // Write pending count after every attempt (success or failure)
      await writePendingCount(db);
    }
  }, [db, isSyncing]);

  // Write initial pending count on mount so the login page sees a value immediately
  useEffect(() => {
    if (!db) return;
    writePendingCount(db);
  }, [db]);

  // Sync on mount and whenever the browser comes back online
  useEffect(() => {
    if (!db) return;

    triggerSync();
    window.addEventListener('online', triggerSync);

    return () => {
      window.removeEventListener('online', triggerSync);
    };
  }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && db) {
        triggerSync();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [db, isSyncing]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isSyncing, lastSyncAt, syncError, triggerSync };
}
