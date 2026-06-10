import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'scheduler-pwa';
const DB_VERSION = 1;
const STORE_NAME = 'schedules';

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const scheduleDB = {
  async getAll() {
    const db = await initDB();
    return db.getAll(STORE_NAME);
  },
  async put(schedule: any) {
    const db = await initDB();
    return db.put(STORE_NAME, schedule);
  },
  async putAll(schedules: any[]) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const schedule of schedules) {
      tx.store.put(schedule);
    }
    await tx.done;
  },
  async delete(id: number | string) {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
  },
  async clear() {
    const db = await initDB();
    return db.clear(STORE_NAME);
  }
};
