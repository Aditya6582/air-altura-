// All 10 airports seeded in the database — matches the seeder exactly
export const AIRPORTS = [
  { code: 'BOM', city: 'Mumbai',    name: 'Chhatrapati Shivaji Maharaj Intl' },
  { code: 'DEL', city: 'Delhi',     name: 'Indira Gandhi International' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International' },
  { code: 'MAA', city: 'Chennai',   name: 'Chennai International' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International' },
  { code: 'COK', city: 'Kochi',     name: 'Cochin International' },
  { code: 'CCU', city: 'Kolkata',   name: 'Netaji Subhas Chandra Bose Intl' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl' },
  { code: 'JAI', city: 'Jaipur',    name: 'Jaipur International' },
  { code: 'PNQ', city: 'Pune',      name: 'Pune Airport' },
];

export const AIRPORT_MAP = Object.fromEntries(AIRPORTS.map(a => [a.code, a]));
