/** Categories with optional emoji icons for UI (stored value is `value`). */
export const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'Food', label: 'Food', icon: '🍽️' },
  { value: 'Housing', label: 'Housing', icon: '🏠' },
  { value: 'Transport', label: 'Transport', icon: '🚗' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'Utilities', label: 'Utilities', icon: '💡' },
  { value: 'Shopping', label: 'Shopping', icon: '🛒' },
  { value: 'Bills', label: 'Bills', icon: '📄' },
  { value: 'Subscriptions', label: 'Subscriptions', icon: '📱' },
  { value: 'Savings', label: 'Savings', icon: '🐖' },
  { value: 'Health', label: 'Health', icon: '🏥' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Gifts', label: 'Gifts & donations', icon: '💝' },
  { value: 'Other', label: 'Other', icon: '📌' },
]

export const EXPENSE_CATEGORIES = EXPENSE_CATEGORY_OPTIONS.map((o) => o.value)
