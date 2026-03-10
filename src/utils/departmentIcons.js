const DEPARTMENT_ICON_MAP = {
  electronics: '📱',
  fashion: '👗',
  clothing: '👕',
  'tech accessories': '🔌',
  'tech accessory': '🔌',
  home: '🏠',
  accessories: '💎',
  religious: '🙏',
  spiritual: '🕉️',
  miniature: '🏗️',
  miniatures: '🏗️',
  model: '🏗️',
  figurine: '🗿',
  collectible: '🏆',
  keychain: '🔑',
  'key chain': '🔑',
  keychains: '🔑',
  'key chains': '🔑',
  decor: '🎨',
  art: '🖼️',
  pattachitra: '🖼️',
  light: '💡',
  glass: '🏺',
  painting: '🎨',
  toy: '🧸',
  gift: '🎁',
  jewelry: '💍',
  planter: '🪴',
  pen: '🖊️',
  board: '📋'
};

export function getDepartmentIcon(name, existingIcon = '') {
  if (existingIcon && String(existingIcon).trim()) {
    return existingIcon;
  }

  const normalizedName = String(name || '').toLowerCase().trim();
  if (!normalizedName) {
    return '📦';
  }

  for (const [key, icon] of Object.entries(DEPARTMENT_ICON_MAP)) {
    if (normalizedName.includes(key)) {
      return icon;
    }
  }

  return '📦';
}
