export const products = [
  { id: 'p1', name: 'Wireless Earbuds Pro', price: 2999, department: 'Electronics', subcategory: 'Audio', emoji: '🎧', isNew: true, rating: 4.8, reviews: 342 },
  { id: 'p2', name: 'Smart Watch Series X', price: 8999, department: 'Electronics', subcategory: 'Wearables', emoji: '⌚', isNew: true, rating: 4.9, reviews: 528 },
  { id: 'p3', name: 'Bluetooth Speaker', price: 3499, department: 'Electronics', subcategory: 'Audio', emoji: '🔊', isNew: false, rating: 4.6, reviews: 215 },
  { id: 'p4', name: '4K Action Camera', price: 12999, department: 'Electronics', subcategory: 'Cameras', emoji: '📷', isNew: true, rating: 4.7, reviews: 189 },
  { id: 'p5', name: 'Wireless Mouse', price: 899, department: 'Electronics', subcategory: 'Accessories', emoji: '🖱️', isNew: false, rating: 4.5, reviews: 456 },
  { id: 'p6', name: 'USB-C Hub', price: 1499, department: 'Electronics', subcategory: 'Accessories', emoji: '🔌', isNew: true, rating: 4.7, reviews: 298 },
  
  { id: 'p7', name: 'Premium Leather Bag', price: 4599, department: 'Fashion', subcategory: 'Bags', emoji: '👜', isNew: false, rating: 4.8, reviews: 421 },
  { id: 'p8', name: 'Organic Cotton Tee', price: 999, department: 'Fashion', subcategory: 'Clothing', emoji: '👕', isNew: false, rating: 4.4, reviews: 678 },
  { id: 'p9', name: 'Silk Scarf Collection', price: 1599, department: 'Fashion', subcategory: 'Accessories', emoji: '🧣', isNew: true, rating: 4.9, reviews: 156 },
  { id: 'p10', name: 'Designer Sunglasses', price: 2499, department: 'Fashion', subcategory: 'Accessories', emoji: '🕶️', isNew: true, rating: 4.6, reviews: 234 },
  { id: 'p11', name: 'Denim Jacket', price: 3299, department: 'Fashion', subcategory: 'Clothing', emoji: '🧥', isNew: false, rating: 4.7, reviews: 389 },
  { id: 'p12', name: 'Leather Wallet', price: 1299, department: 'Fashion', subcategory: 'Accessories', emoji: '👛', isNew: false, rating: 4.5, reviews: 512 },
  
  { id: 'p13', name: 'Minimalist Desk Lamp', price: 1899, department: 'Home', subcategory: 'Lighting', emoji: '💡', isNew: true, rating: 4.8, reviews: 267 },
  { id: 'p14', name: 'Ceramic Plant Pot', price: 749, department: 'Home', subcategory: 'Decor', emoji: '🪴', isNew: true, rating: 4.7, reviews: 324 },
  { id: 'p15', name: 'Throw Pillow Set', price: 1499, department: 'Home', subcategory: 'Textiles', emoji: '🛋️', isNew: false, rating: 4.6, reviews: 445 },
  { id: 'p16', name: 'Wall Art Canvas', price: 2199, department: 'Home', subcategory: 'Decor', emoji: '🖼️', isNew: true, rating: 4.9, reviews: 198 },
  { id: 'p17', name: 'Scented Candle Set', price: 999, department: 'Home', subcategory: 'Decor', emoji: '🕯️', isNew: false, rating: 4.5, reviews: 589 },
  { id: 'p18', name: 'Kitchen Storage Jars', price: 899, department: 'Home', subcategory: 'Kitchen', emoji: '🫙', isNew: false, rating: 4.4, reviews: 423 },
  
  { id: 'p19', name: 'Stainless Steel Watch', price: 5999, department: 'Accessories', subcategory: 'Watches', emoji: '⌚', isNew: true, rating: 4.8, reviews: 276 },
  { id: 'p20', name: 'Pearl Necklace', price: 3499, department: 'Accessories', subcategory: 'Jewelry', emoji: '📿', isNew: false, rating: 4.7, reviews: 345 },
  { id: 'p21', name: 'Gold Ring Set', price: 4299, department: 'Accessories', subcategory: 'Jewelry', emoji: '💍', isNew: true, rating: 4.9, reviews: 412 },
  { id: 'p22', name: 'Leather Belt', price: 1299, department: 'Accessories', subcategory: 'Belts', emoji: '👔', isNew: false, rating: 4.6, reviews: 534 },
  { id: 'p23', name: 'Luxury Pen', price: 2999, department: 'Accessories', subcategory: 'Writing', emoji: '🖊️', isNew: true, rating: 4.8, reviews: 189 },
  { id: 'p24', name: 'Phone Case', price: 599, department: 'Accessories', subcategory: 'Tech', emoji: '📱', isNew: false, rating: 4.3, reviews: 789 }
];

export const departments = [
  { 
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    color: 'from-blue-500 to-indigo-500',
    description: 'Discover the latest in tech innovation',
    subcategories: ['Audio', 'Wearables', 'Cameras', 'Accessories']
  },
  { 
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    color: 'from-pink-500 to-rose-500',
    description: 'Style that speaks volumes',
    subcategories: ['Clothing', 'Bags', 'Accessories']
  },
  { 
    id: 'home',
    name: 'Home & Living',
    icon: '🏠',
    color: 'from-green-500 to-emerald-500',
    description: 'Transform your living spaces',
    subcategories: ['Lighting', 'Decor', 'Textiles', 'Kitchen']
  },
  { 
    id: 'accessories',
    name: 'Accessories',
    icon: '💎',
    color: 'from-amber-500 to-orange-500',
    description: 'Perfect finishing touches',
    subcategories: ['Watches', 'Jewelry', 'Belts', 'Writing', 'Tech']
  }
];

export const categories = [
  { id: 'c1', name: 'Electronics', icon: '📱', color: 'from-blue-500 to-indigo-500' },
  { id: 'c2', name: 'Fashion', icon: '👗', color: 'from-pink-500 to-rose-500' },
  { id: 'c3', name: 'Home & Living', icon: '🏠', color: 'from-green-500 to-emerald-500' },
  { id: 'c4', name: 'Accessories', icon: '💎', color: 'from-amber-500 to-orange-500' }
];

export const subcategoryEmojis = {
  'Audio': '🎵',
  'Wearables': '⌚',
  'Cameras': '📷',
  'Accessories': '🔌',
  'Clothing': '👕',
  'Bags': '👜',
  'Lighting': '💡',
  'Decor': '🎨',
  'Textiles': '🛋️',
  'Kitchen': '🍳',
  'Watches': '⌚',
  'Jewelry': '💎',
  'Belts': '👔',
  'Writing': '✍️',
  'Tech': '📱'
};
