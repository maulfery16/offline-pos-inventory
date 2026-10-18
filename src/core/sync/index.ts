'use client';

import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';

export async function syncDatabase(db: Database): Promise<void> {
  await synchronize({
    database: db,

    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const token = localStorage.getItem('deviceToken') || '';

      const response = await fetch(
        `/api/sync?lastPulledAt=${lastPulledAt ?? 0}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Sync pull failed: ' + response.statusText);
      }

      const json = await response.json();

      return {
        changes: json.changes,
        timestamp: json.timestamp,
      };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      const token = localStorage.getItem('deviceToken') || '';

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changes, lastPulledAt }),
      });

      if (!response.ok) {
        throw new Error('Sync push failed: ' + response.statusText);
      }
    },

    migrationsEnabledAtVersion: 1,
  });
}
