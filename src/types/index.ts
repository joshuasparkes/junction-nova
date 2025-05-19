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
  passengerCount: number;
  expiresAt?: string;
}

// Suggested types (place in src/types.ts or similar)

export interface PassportInput {
  documentNumber: string;
  issueCountry: string;
  nationality: string;
  expirationDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
}

export interface AddressInput {
  addressLines: string[];
  countryCode: string;
  postalCode: string;
  city: string;
}

export interface PassengerInput {
  // For UI state, we might add a temporary unique ID if managing a dynamic list later
  // id: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phoneNumber: string | null; // Can be null
  passportInformation: PassportInput;
  residentialAddress: AddressInput;
}

export interface TrainOffer {
  // Or a generic Offer type
  id: string; // This is the offerId used in the booking request
  // For display on booking screen:
  price?: {amount: string; currency: string};
  segments?: any[]; // Define more accurately based on actual offer structure
  // Example details you might want to display:
  providerName?: string;
  originStationName?: string;
  destinationStationName?: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
}

// For the API response structure
export interface BookingResponsePassenger {
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phoneNumber: string | null;
  passportInformation: PassportInput | null; // API shows it can be null in response
  residentialAddress: AddressInput;
  price: {currency: string; amount: string} | null;
}

export interface BookingPrice {
  currency: string;
  amount: string;
}

export interface BookingDetails {
  // Corresponds to the "booking" object in the response
  id: string;
  status: string;
  passengers: BookingResponsePassenger[];
  price: BookingPrice;
  priceBreakdown: Array<{price: BookingPrice; breakdownType: string}>;
  ticketInformation: Array<{
    status: string;
    ticketUrl: string | null;
    collectionReference: string | null;
  }>;
  fareRules: Array<{title: string; body: string}>;
  trips: Array<{segments: any[]}>; // Define segments more accurately
  metadata?: any;
}

export interface FulfillmentOption {
  deliveryOption: string;
  collectionFee: BookingPrice | null;
}

export interface FulfillmentInformation {
  fulfillmentOptions: FulfillmentOption[];
  segmentSequence: number;
}

export interface CreateTrainBookingApiResponse {
  booking: BookingDetails;
  fulfillmentInformation: FulfillmentInformation[];
}

// === MOVED FROM src/types/multimodal.ts START ===
export interface ApiPlace {
  id: string;
  name: string;
  iataCode?: string;
  stationCode?: string;
  cityName?: string;
  countryCode?: string;
  type: 'airport' | 'railway-station' | string; // API might return more generic string
  // Ensure the actual API response structure for places is matched, especially for city name.
  // The API GET /places returns { data: ApiPlace[] }
}

export interface PlaceInfo {
  name: string;
  city: string;
}

export interface Leg {
  id: string; // Offer ID from API
  mode: 'train' | 'flight';
  operator: string;
  from: PlaceInfo;
  to: PlaceInfo;
  depart: string; // ISO string "YYYY-MM-DDTHH:mm:ssZ" or with offset
  arrive: string; // ISO string "YYYY-MM-DDTHH:mm:ssZ" or with offset
  price: number; // minor units
  // additional properties like duration for the leg can be useful
  durationMinutes?: number;
}

export interface Itinerary {
  id: string; // e.g., combination of leg ids or UUID
  legs: Leg[];
  totalDuration: number; // minutes
  totalPrice: number; // minor units
  transfers: number;
}

// Updated based on API sample responses
export interface ApiOfferSegmentOriginDestination {
  placeId?: string;
  name: string;
  iataCode?: string;
  city_name?: string; // If provided by API, though sample shows city in 'name' for airports
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any; // Allow other properties
}

export interface ApiOfferSegment {
  origin: ApiOfferSegmentOriginDestination | string; // String for train ID, object for flight place details
  destination: ApiOfferSegmentOriginDestination | string; // String for train ID, object for flight place details
  departureAt: string; // Corrected field name from API samples
  arrivalAt: string; // Corrected field name from API samples
  marketing_carrier?: {name: string; [key: string]: any};
  operating_carrier?: {name: string; [key: string]: any}; // For flights
  vehicle?: {name: string; code?: string; [key: string]: any}; // For trains
  fare?: {type?: string; marketingName?: string; [key: string]: any};
  stops?: any[]; // For trains
  [key: string]: any;
}

export interface ApiOfferTrip {
  // Renamed from ApiOfferSlice
  segments: ApiOfferSegment[];
  // Potentially other trip-level details
  [key: string]: any;
}

export interface ApiOfferPrice {
  currency: string;
  amount: string; // API sends this as a string e.g. "73.00" or "1615.01"
}

export interface ApiOffer {
  id: string;
  expiresAt?: string;
  price?: ApiOfferPrice; // Corrected structure based on API samples
  priceBreakdown?: Array<{price: ApiOfferPrice; breakdownType: string}>;
  passportInformation?: string;
  owner?: {name: string; [key: string]: any}; // Operator for flights (tentative)
  trips: ApiOfferTrip[]; // Corrected from slices, based on API samples
  metadata?: {providerId?: string; [key: string]: any}; // For trains
  inboundStepRequired?: boolean; // For trains
  [key: string]: any;
}

// Response from GET /train-searches/{id}/offers or /flight-searches/{id}/offers
export interface ListOffersResponse {
  items: ApiOffer[];
  links?: {next?: string | null};
  meta?: {itemsOnPage?: number; cursors?: {next?: string | null}};
  [key: string]: any;
}
// === MOVED FROM src/types/multimodal.ts END ===
