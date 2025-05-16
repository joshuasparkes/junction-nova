import {Flight, Hotel, Train, CarRental} from '../data/mockData'; // Assuming your mockData exports these types
import {Flight} from '../types'; // Ensure Flight is imported if used in other stacks

export type BookingsStackParamList = {
  BookingsList: undefined; // The main screen for listing bookings
  // BookingDetail: { bookingId: string }; // Example for a future detail screen
};

export type FlightStackParamList = {
  FlightSearch: undefined;
  FlightBooking: {flight: Flight};
  FlightBookingHoldScreen: {
    bookingId: string;
    flightDetails: Flight;
    passengerName: string;
    bookingStatus: string;
    bookingPrice: string;
  };
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details: string[];
  };
};

export type HotelStackParamList = {
  HotelSearch: undefined;
  HotelBooking: {hotelId: string}; // Example
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details: string[];
  };
};

export type TrainStackParamList = {
  TrainSearch: undefined;
  TrainBooking: {trainOffer: TrainOffer}; // Pass the selected train offer
  TrainBookingHoldScreen: {
    // For the next step
    bookingDetails: BookingDetails; // from CreateTrainBookingApiResponse
    fulfillmentInformation: FulfillmentInformation[]; // from CreateTrainBookingApiResponse
    trainOfferDetails: TrainOffer;
  };
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details: string[];
  };
};

export type CarRentalStackParamList = {
  CarRentalSearch: undefined;
  CarRentalBooking: {carId: string}; // Example
  BookingSuccess: {
    message: string;
    bookedItemName: string;
    details: string[];
  };
};

export type MultimodalStackParamList = {
  MultimodalSearch: undefined;
};

// You might also want to define the types for the item itself if not already done
// e.g., in your mockData.ts, ensure Flight, Hotel, Train, CarRental are exported types.
// For now, I'll assume they are available from mockData.ts.
// If not, you'd define them here or import them from where they are defined.
