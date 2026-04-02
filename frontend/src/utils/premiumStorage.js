import { STORAGE_PREMIUM, STORAGE_SOFT_OFFER } from '../constants/monetization'

export function getIsPremiumDemo() {
  try {
    return localStorage.getItem(STORAGE_PREMIUM) === '1'
  } catch {
    return false
  }
}

export function setPremiumDemo() {
  try {
    localStorage.setItem(STORAGE_PREMIUM, '1')
  } catch {
    /* ignore */
  }
}

export function setPendingSoftOffer() {
  try {
    localStorage.setItem(STORAGE_SOFT_OFFER, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function clearPendingSoftOffer() {
  try {
    localStorage.removeItem(STORAGE_SOFT_OFFER)
  } catch {
    /* ignore */
  }
}

export function hasPendingSoftOffer() {
  try {
    return localStorage.getItem(STORAGE_SOFT_OFFER) != null
  } catch {
    return false
  }
}
