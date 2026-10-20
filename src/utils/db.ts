import { openDB, type IDBPDatabase } from 'idb';

/**
 * What the app keeps on the device to work offline (see utils/offlineSync):
 * - schedules:     the offline window (this week and next), everyone's, as the API returns them
 * - notifications: the latest notifications of the signed-in user
 * - meta:          small values (the window, when it was saved, whose data it is)
 * Wiped on sign-out (clearOfflineData).
 */
const DB_NAME = 'scheduler-pwa';
// 2: separate stores for notifications and meta; the schedules store now only holds the window
const DB_VERSION = 2;

const SCHEDULES = 'schedules';
const NOTIFICATIONS = 'notifications';
const META = 'meta';

let opening: Promise<IDBPDatabase> | null = null;

export const initDB = (): Promise<IDBPDatabase> => {
  opening ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // version 1 mixed whatever window was last viewed: start clean
      if (oldVersion < 2 && db.objectStoreNames.contains(SCHEDULES)) {
        db.deleteObjectStore(SCHEDULES);
      }
      if (!db.objectStoreNames.contains(SCHEDULES)) db.createObjectStore(SCHEDULES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(NOTIFICATIONS)) db.createObjectStore(NOTIFICATIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    },
  });
  return opening;
};

/** A store whose content is replaced as a whole (the offline copy of a list). */
function listStore<T extends { id: string | number }>(name: string) {
  return {
    async getAll(): Promise<T[]> {
      return (await initDB()).getAll(name);
    },
    async get(id: string | number): Promise<T | undefined> {
      return (await initDB()).get(name, id);
    },
    async put(item: T) {
      return (await initDB()).put(name, item);
    },
    async delete(id: string | number) {
      return (await initDB()).delete(name, id);
    },
    async replaceAll(items: T[]) {
      const tx = (await initDB()).transaction(name, 'readwrite');
      await tx.store.clear();
      for (const item of items) tx.store.put(item);
      await tx.done;
    },
    async clear() {
      return (await initDB()).clear(name);
    },
  };
}

export const scheduleDB = listStore<any>(SCHEDULES);
export const notificationDB = listStore<any>(NOTIFICATIONS);

export const metaDB = {
  async get<T>(key: string): Promise<T | undefined> {
    return (await initDB()).get(META, key);
  },
  async set(key: string, value: unknown) {
    return (await initDB()).put(META, value, key);
  },
  async clear() {
    return (await initDB()).clear(META);
  },
};

/** Sign-out: nothing of this account may stay on the device. */
export async function clearOfflineData(): Promise<void> {
  try {
    await Promise.all([scheduleDB.clear(), notificationDB.clear(), metaDB.clear()]);
  } catch (error) {
    console.warn('Could not clear the offline data.', error);
  }
}
