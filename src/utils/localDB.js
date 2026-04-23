const DB_NAME = 'bella_toka_db'
const STORE = 'images'

export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)

    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveImage(record) {
  const db = await initDB()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(record)
  return tx.complete
}

export async function getImages() {
  const db = await initDB()
  const tx = db.transaction(STORE, 'readonly')
  return tx.objectStore(STORE).getAll()
}