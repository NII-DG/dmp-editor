import { AtomEffect } from "recoil"

const getParsedStorage = <T>(storage: Storage, key: string): T | null => {
  const storedValue = storage.getItem(key)
  if (storedValue == null) return null

  try {
    return JSON.parse(storedValue) as T
  } catch (error) {
    console.error(`Failed to parse storage item: ${key}`, error)
    return null
  }
}

const safeStringify = (value: unknown): string | null => {
  try {
    return JSON.stringify(value)
  } catch (error) {
    console.error("Failed to serialize value for storage", error)
    return null
  }
}

const createStorageEffect = <T>(storage: Storage, key: string): AtomEffect<T> => ({ setSelf, onSet }) => {
  const savedValue = getParsedStorage<T>(storage, key)
  if (savedValue !== null) {
    setSelf(savedValue)
  }

  onSet((newValue, _, isReset) => {
    if (isReset) {
      storage.removeItem(key)
    } else {
      const serializedValue = safeStringify(newValue)
      if (serializedValue !== null) {
        storage.setItem(key, serializedValue)
      }
    }
  })
}

export const localStorageEffect = <T>(key: string) => createStorageEffect<T>(localStorage, key)

export const sessionStorageEffect = <T>(key: string) => createStorageEffect<T>(sessionStorage, key)
