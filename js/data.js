const CATEGORIES = [
  { id: 'coffee', name: 'Coffee' },
  { id: 'tea', name: 'Tea' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'dessert', name: 'Dessert' }
];

const MENU_ITEMS = [
  {
    id: 1,
    name: 'Espresso',
    category: 'coffee',
    price: 2500,
    description: 'A concentrated shot with a deep roasted aroma.',
    image: ''
  },
  {
    id: 2,
    name: 'Americano',
    category: 'coffee',
    price: 3500,
    description: 'Smooth espresso lengthened with hot water.',
    image: ''
  },
  {
    id: 3,
    name: 'Cafe Latte',
    category: 'coffee',
    price: 4200,
    description: 'Espresso with steamed milk and a soft finish.',
    image: ''
  },
  {
    id: 4,
    name: 'Cappuccino',
    category: 'coffee',
    price: 4500,
    description: 'Espresso, warm milk, and a thick foam cap.',
    image: ''
  },
  {
    id: 5,
    name: 'Mocha',
    category: 'coffee',
    price: 4800,
    description: 'Coffee and chocolate blended into a rich cup.',
    image: ''
  },
  {
    id: 6,
    name: 'Vanilla Latte',
    category: 'coffee',
    price: 4800,
    description: 'Cafe latte with fragrant vanilla syrup.',
    image: ''
  },
  {
    id: 7,
    name: 'Green Tea',
    category: 'tea',
    price: 3200,
    description: 'Clean, fragrant green tea served warm.',
    image: ''
  },
  {
    id: 8,
    name: 'Iced Tea',
    category: 'tea',
    price: 3500,
    description: 'Chilled black tea with a refreshing finish.',
    image: ''
  },
  {
    id: 9,
    name: 'Chamomile',
    category: 'tea',
    price: 3500,
    description: 'A gentle herbal tea for a quiet break.',
    image: ''
  },
  {
    id: 10,
    name: 'Matcha Latte',
    category: 'tea',
    price: 4500,
    description: 'Uji matcha blended with creamy milk.',
    image: ''
  },
  {
    id: 11,
    name: 'Croissant',
    category: 'bakery',
    price: 2800,
    description: 'A flaky butter croissant baked until golden.',
    image: ''
  },
  {
    id: 12,
    name: 'Bagel',
    category: 'bakery',
    price: 2500,
    description: 'A chewy plain bagel with a crisp crust.',
    image: ''
  },
  {
    id: 13,
    name: 'Blueberry Muffin',
    category: 'bakery',
    price: 3000,
    description: 'Soft muffin filled with blueberries.',
    image: ''
  },
  {
    id: 14,
    name: 'Chocolate Cookie',
    category: 'bakery',
    price: 2200,
    description: 'A crisp cookie with chocolate chips.',
    image: ''
  },
  {
    id: 15,
    name: 'Tiramisu',
    category: 'dessert',
    price: 5500,
    description: 'Classic Italian dessert with coffee and mascarpone.',
    image: ''
  },
  {
    id: 16,
    name: 'Cheesecake',
    category: 'dessert',
    price: 4800,
    description: 'A rich cheesecake on a crisp base.',
    image: ''
  },
  {
    id: 17,
    name: 'Gelato',
    category: 'dessert',
    price: 4200,
    description: 'Dense Italian-style ice cream.',
    image: ''
  },
  {
    id: 18,
    name: 'Strawberry Cake',
    category: 'dessert',
    price: 5200,
    description: 'Fresh cream cake layered with strawberries.',
    image: ''
  }
];

const ORDER_STATUS = {
  PENDING: { value: 'pending', label: 'Pending' },
  CONFIRMED: { value: 'confirmed', label: 'Confirmed' },
  PREPARING: { value: 'preparing', label: 'Preparing' },
  READY: { value: 'ready', label: 'Ready' },
  COMPLETED: { value: 'completed', label: 'Completed' },
  CANCELLED: { value: 'cancelled', label: 'Cancelled' }
};
