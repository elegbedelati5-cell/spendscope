/** Display name: saved profile name, else derived from email local-part. */
export function displayNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'there'
  const local = email.split('@')[0] || ''
  const word = local.split(/[._-]/)[0] || local
  if (!word) return 'there'
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function getDisplayName(user) {
  const n = user?.name?.trim()
  if (n) return n
  return displayNameFromEmail(user?.email)
}

export function getInitials(user) {
  const label = getDisplayName(user)
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return label.slice(0, 2).toUpperCase() || '?'
}
