import {Flight, Hotel, Train, CarRental} from '../data/mockData'; // Assuming your mockData exports these types

export type FlightStackParamList = {
  FlightSearch: undefined; // No params needed for the initial search screen
  FlightBooking: {flight: Flight};
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details?: string[];
  };
};

export type HotelStackParamList = {
  HotelSearch: undefined;
  HotelBooking: {hotel: Hotel};
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details?: string[];
  };
};

export type TrainStackParamList = {
  TrainSearch: undefined;
  TrainBooking: {train: Train};
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details?: string[];
  };
};

export type CarRentalStackParamList = {
  CarRentalSearch: undefined;
  CarRentalBooking: {car: CarRental};
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details?: string[];
  };
};

// You might also want to define the types for the item itself if not already done
// e.g., in your mockData.ts, ensure Flight, Hotel, Train, CarRental are exported types.
// For now, I'll assume they are available from mockData.ts.
// If not, you'd define them here or import them from where they are defined.
