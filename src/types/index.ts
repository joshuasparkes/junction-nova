export interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  placeTypes: Array<
    'unspecified' | 'city' | 'railway-station' | 'airport' | 'ferry-port'
  >;
  coordinates: PlaceCoordinates;
  countryCode: string;
  countryName: string;
  iataCode: string | null;
  timeZone: string;
}

export interface Flight {
  id: string;
  airline: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  stops: string;
}

export interface FlightPrice {
  currency: string;
  amount: string;
}

export interface FlightPriceBreakdown {
  price: FlightPrice;
  breakdownType: string;
}

export interface FlightSegmentPlace {
  placeId: string;
  name: string;
  iataCode: string;
  coordinates: PlaceCoordinates;
}

export interface FlightFare {
  type: string;
  marketingName: string;
}

export interface FlightSegment {
  origin: FlightSegmentPlace;
  destination: FlightSegmentPlace;
  departureAt: string;
  arrivalAt: string;
  fare: FlightFare;
}

export interface FlightTrip {
  segments: FlightSegment[];
}

export interface ApiFlightOffer {
  id: string;
  expiresAt: string;
  price: FlightPrice;
  priceBreakdown: FlightPriceBreakdown[];
  passportInformation: string;
  trips: FlightTrip[];
}

export interface ListFlightOffersResponse {
  items: ApiFlightOffer[];
  links?: {
    next?: string | null;
  };
  meta?: {
    itemsOnPage?: number;
    cursors?: {
      next?: string | null;
    };
  };
}

// You could also move Flight, ApiFlightOffer etc. here later if needed elsewhere

// --- Train Offer Types ---

// Reusing FlightPrice, FlightPriceBreakdown, FlightFare if structure is identical

export interface TrainStop {
  place: string; // Place ID
  departureAt?: string;
  arrivalAt?: string;
}

export interface TrainVehicle {
  name: string;
  code: string;
}

export interface TrainSegment {
  origin: string; // Place ID
  destination: string; // Place ID
  departureAt: string;
  arrivalAt: string;
  fare: FlightFare;
  stops: TrainStop[];
  vehicle: TrainVehicle;
}

export interface TrainTrip {
  segments: TrainSegment[];
}

export interface ApiTrainOffer {
  id: string;
  expiresAt: string;
  inboundStepRequired: boolean;
  price: FlightPrice;
  priceBreakdown: FlightPriceBreakdown[];
  passportInformation: string;
  trips: TrainTrip[];
  metadata?: object;
}

export interface ListTrainOffersResponse {
  items: ApiTrainOffer[];
  links?: {
    next?: string | null;
  };
  meta?: {
    itemsOnPage?: number;
    cursors?: {
      next?: string | null;
    };
  };
}

// Existing Train type (from mockData) - Target structure for transformation
export interface Train {
  id: string;
  operator: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  class: string;
  price: string;
}
