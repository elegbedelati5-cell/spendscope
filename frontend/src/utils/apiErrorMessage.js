/**
 * Turns axios/fetch errors into a short message for auth and forms.
 */
export function getApiErrorMessage(err, fallback) {
  const apiMsg = err?.response?.data?.error
  if (typeof apiMsg === 'string' && apiMsg.trim()) return apiMsg.trim()

  const code = err?.code
  const msg = err?.message || ''
  if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || msg === 'Network Error') {
    return 'Cannot reach the API. Start the backend from the backend folder (npm run dev) and keep it on port 4000.'
  }

  return fallback
}
