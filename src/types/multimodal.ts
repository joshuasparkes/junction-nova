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
