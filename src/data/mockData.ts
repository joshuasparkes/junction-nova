export interface Flight {
  id: string;
  airline: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  duration: string;
  stops: string;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  pricePerNight: string;
  amenities: string;
}

export const mockFlightsData: Flight[] = [
  {
    id: '1',
    airline: 'Nova Air',
    from: 'New York (JFK)',
    to: 'London (LHR)',
    departureTime: '08:00',
    arrivalTime: '20:00',
    price: '$550',
    duration: '7h 00m',
    stops: 'Non-stop',
  },
  {
    id: '2',
    airline: 'Sky Connect',
    from: 'New York (JFK)',
    to: 'London (LHR)',
    departureTime: '10:30',
    arrivalTime: '22:45',
    price: '$520',
    duration: '7h 15m',
    stops: '1 stop (Paris CDG)',
  },
  {
    id: '3',
    airline: 'Budget Wings',
    from: 'New York (JFK)',
    to: 'London (LHR)',
    departureTime: '13:15',
    arrivalTime: '01:00',
    price: '$480',
    duration: '6h 45m',
    stops: 'Non-stop',
  },
];

export const mockHotelsData: Hotel[] = [
  {
    id: '1',
    name: 'The Grand Plaza',
    location: 'Central London',
    rating: 4.5,
    pricePerNight: '$180',
    amenities: 'Pool, Gym, Free WiFi',
  },
  {
    id: '2',
    name: 'City Comfort Inn',
    location: 'Near Paddington Station',
    rating: 3.8,
    pricePerNight: '$120',
    amenities: 'Breakfast included, WiFi',
  },
  {
    id: '3',
    name: 'Riverside Boutique Hotel',
    location: 'South Bank',
    rating: 4.2,
    pricePerNight: '$210',
    amenities: 'River view, Restaurant, Bar',
  },
];

export const mockTrainsData = [
  {
    id: '1',
    operator: 'Nova Rail',
    from: "London King's Cross",
    to: 'Edinburgh Waverley',
    departureTime: '09:00',
    arrivalTime: '13:30',
    price: '$80',
    duration: '4h 30m',
    class: 'Standard',
  },
  {
    id: '2',
    operator: 'ExpressLink',
    from: 'London Euston',
    to: 'Manchester Piccadilly',
    departureTime: '11:15',
    arrivalTime: '13:20',
    price: '$65',
    duration: '2h 05m',
    class: 'First Class',
  },
];

export const mockCarRentalsData = [
  {
    id: '1',
    company: 'Nova Wheels',
    type: 'Sedan (e.g., Toyota Camry)',
    pickupLocation: 'Heathrow Airport T2',
    pricePerDay: '$45',
    features: 'Automatic, AC, GPS',
  },
  {
    id: '2',
    company: 'DriveEasy',
    type: 'SUV (e.g., Ford Explorer)',
    pickupLocation: 'Gatwick Airport North',
    pricePerDay: '$60',
    features: '7 Seater, Automatic, Bluetooth',
  },
];
