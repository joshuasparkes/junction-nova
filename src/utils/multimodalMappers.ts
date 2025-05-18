import {ListOffersResponse, ApiOffer} from '../types/multimodal'; // Assuming types are in ../types/multimodal.ts
import {
  Leg,
  ApiOfferSlice,
  ApiOfferSegment,
  PlaceInfo,
  ApiPlace,
  ApiOfferTrip,
} from '../types/multimodal'; // Ensure path is correct

const API_KEY = 'jk_live_01j8r3grxbeve8ta0h1t5qbrvx';
const BASE_URL = 'https://content-api.sandbox.junction.dev';
const MAX_POLLING_ATTEMPTS = 10;
const POLLING_INTERVAL = 2000; // 2 seconds

interface InitiateSearchResponse {
  searchId: string;
  type: 'train' | 'flight';
}

export async function initiateSearch(
  type: 'train' | 'flight',
  originId: string,
  destinationId: string,
  departureAfter: string, // Full ISO DateTime string e.g. YYYY-MM-DDTHH:mm:ssZ
  passengerDob: string, // YYYY-MM-DD
): Promise<InitiateSearchResponse> {
  const url = `${BASE_URL}/${type}-searches`;
  const body = {
    originId,
    destinationId,
    departureAfter,
    returnDepartureAfter: null, // As per plan
    passengerAges: [{dateOfBirth: passengerDob}], // Plan: passengerAges: [{ dateOfBirth: ISODateString }]
  };

  console.log(`Initiating ${type} search:`, JSON.stringify(body, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (response.status !== 202) {
    // Expecting 202 Accepted
    const errorText = await response.text();
    console.error(
      `Failed to initiate ${type} search: ${response.status}`,
      errorText,
    );
    throw new Error(
      `Failed to initiate ${type} search: ${response.status} ${errorText}`,
    );
  }

  const locationHeader = response.headers.get('Location');
  if (!locationHeader) {
    throw new Error(
      `Location header missing in ${type} search initiation response.`,
    );
  }

  // Regex to capture train_search_id or flight_search_id
  // e.g., /train-searches/train_search_abcdef12345/offers or /flight-searches/flight_search_abcdef12345/offers
  const searchIdMatch = locationHeader.match(
    new RegExp(`${type}-searches\\/(${type}_search_[a-zA-Z0-9]+)`),
  );
  const searchId = searchIdMatch?.[1];

  if (!searchId) {
    throw new Error(
      `Could not parse ${type}SearchId from Location header: ${locationHeader}`,
    );
  }
  console.log(`Extracted ${type}SearchId:`, searchId);
  return {searchId, type};
}

export async function pollOffers(
  type: 'train' | 'flight',
  searchId: string,
): Promise<ApiOffer[]> {
  // Plan: Promise<Offer[]> which I take to mean ApiOffer[]
  const offersUrl = `${BASE_URL}/${type}-searches/${searchId}/offers`;
  let attempts = 0;
  let offersData: ApiOffer[] = [];
  let offersFound = false;

  console.log(`Polling for ${type} offers at ${offersUrl}...`);

  while (attempts < MAX_POLLING_ATTEMPTS && !offersFound) {
    attempts++;
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
    console.log(
      `Polling attempt ${attempts} for ${type} search ID ${searchId}...`,
    );

    try {
      const response = await fetch(offersUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          Accept: 'application/json',
        },
      });

      const responseText = await response.text(); // Read text first for robust error handling

      if (!response.ok) {
        console.error(
          `Attempt ${attempts} - Failed to get ${type} offers: ${response.status}`,
          responseText,
        );
        if (attempts === MAX_POLLING_ATTEMPTS) {
          throw new Error(
            `Failed to fetch ${type} offers after ${attempts} attempts. Status: ${response.status}. Body: ${responseText}`,
          );
        }
        continue;
      }

      if (!responseText) {
        console.log(
          `Attempt ${attempts} - Empty response body for ${type} offers. Status: ${response.status}. Continuing to poll.`,
        );
        // Some APIs might return 200 with empty body while processing.
        // Or it could be 204 No Content. If offers are truly not ready, we continue polling.
        if (response.status === 204 && attempts === MAX_POLLING_ATTEMPTS) {
          console.log(
            `Polling timeout for ${type} offers: received 204 No Content on final attempt.`,
          );
          // Return empty array if no content on final attempt, as per plan to return Offer[]
          return [];
        }
        continue;
      }

      const parsedData: ListOffersResponse = JSON.parse(responseText);

      if (parsedData && parsedData.items && parsedData.items.length > 0) {
        offersData = parsedData.items;
        offersFound = true;
        console.log(
          `Attempt ${attempts} - ${type} offers found for ${searchId}! Count: ${offersData.length}`,
        );
      } else {
        console.log(
          `Attempt ${attempts} - Offers response OK but no items found for ${type} search ID ${searchId}.`,
        );
        // If API guarantees items array once ready, continue polling if empty but not final attempt
      }
    } catch (error) {
      console.error(
        `Attempt ${attempts} - Error during polling for ${type} offers (${searchId}):`,
        error,
      );
      if (attempts === MAX_POLLING_ATTEMPTS) {
        // If parsing fails on the last attempt, or any other error, rethrow or throw specific error
        throw new Error(
          `Failed to get or parse ${type} offers for ${searchId} after ${attempts} attempts: ${error.message}`,
        );
      }
      // Otherwise, continue to the next attempt
    }
  }

  if (!offersFound) {
    console.log(
      `No ${type} offers found for ${searchId} after ${MAX_POLLING_ATTEMPTS} attempts.`,
    );
  }
  return offersData; // Returns empty array if no offers found after polling
}

// Helper for place search (as discussed in thought process)
// This will be used in MultimodalSearchScreen.tsx
export async function fetchPlacesApi(query: string): Promise<any[]> {
  // Return type should be ApiPlace[]
  const headers = {Accept: 'application/json', 'x-api-key': API_KEY};
  const encodedQuery = encodeURIComponent(query);

  const stationUrl = `${BASE_URL}/places?filter[type][eq]=railway-station&filter[name][like]=${encodedQuery}`;
  const airportUrl = `${BASE_URL}/places?filter[type][eq]=airport&filter[name][like]=${encodedQuery}`;

  try {
    const [stationResponse, airportResponse] = await Promise.all([
      fetch(stationUrl, {headers}),
      fetch(airportUrl, {headers}),
    ]);

    const stationJson = stationResponse.ok
      ? await stationResponse.json()
      : {data: []};
    const airportJson = airportResponse.ok
      ? await airportResponse.json()
      : {data: []};

    const stations = (stationJson.data || []).map((s: any) => ({
      ...s,
      type: 'railway-station',
    }));
    const airports = (airportJson.data || []).map((a: any) => ({
      ...a,
      type: 'airport',
    }));

    return [...stations, ...airports];
  } catch (error) {
    console.error('Failed to fetch places from API:', error);
    return [];
  }
}

// Helper function: getPlaceInfo (for flights, where segment.origin/destination are objects)
function getFlightPlaceInfo(
  apiSegmentPlace:
    | {name: string; city_name?: string; iataCode?: string; [key: string]: any}
    | undefined,
): PlaceInfo {
  if (!apiSegmentPlace) {
    return {name: 'Unknown', city: 'Unknown'};
  }
  const name = apiSegmentPlace.name || 'Unknown Place';
  // Attempt to extract city: use city_name, fallback to parsing from name (e.g., "Airport, City"), then default.
  const cityFromName = name.includes(',')
    ? name.substring(name.lastIndexOf(',') + 1).trim()
    : 'Unknown City';
  const city = apiSegmentPlace.city_name || cityFromName;

  // Ensure the 'name' part doesn't redundantly include the city if city is found
  const displayName =
    name.includes(',') && city !== 'Unknown City'
      ? name.substring(0, name.lastIndexOf(',')).trim()
      : name;

  return {
    name: displayName,
    city: city,
  };
}

// Helper for train place info using the initially selected ApiPlace objects
function getTrainPlaceInfo(station: ApiPlace | null | undefined): PlaceInfo {
  if (!station) {
    return {name: 'Unknown Station', city: 'Unknown City'};
  }
  // Use station.cityName if available, otherwise try to parse from station.name
  const cityFromName = station.name.includes(',')
    ? station.name.substring(station.name.lastIndexOf(',') + 1).trim()
    : station.name; // Fallback to full name if no comma
  const city = station.cityName || cityFromName;
  const displayName =
    station.name.includes(',') && city !== station.name
      ? station.name.substring(0, station.name.lastIndexOf(',')).trim()
      : station.name;

  return {
    name: displayName,
    city: city,
  };
}

function calculateDurationMinutes(
  departISO: string,
  arriveISO: string,
): number | undefined {
  try {
    const departDate = new Date(departISO);
    const arriveDate = new Date(arriveISO);
    if (isNaN(departDate.getTime()) || isNaN(arriveDate.getTime())) {
      console.warn(
        '[calculateDurationMinutes] Invalid date for duration calculation:',
        departISO,
        arriveISO,
      );
      return undefined;
    }
    return Math.round(
      (arriveDate.getTime() - departDate.getTime()) / (1000 * 60),
    );
  } catch (e) {
    console.error('[calculateDurationMinutes] Error calculating duration:', e);
    return undefined;
  }
}

// For mapTrainOfferToLeg, we need the original selected stations for name/city details
export function mapTrainOfferToLeg(
  offer: ApiOffer,
  originalDepartureStation: ApiPlace | null,
  originalArrivalStation: ApiPlace | null,
): Leg | null {
  try {
    const firstTrip: ApiOfferTrip | undefined = offer.trips?.[0];
    if (!firstTrip || !firstTrip.segments || firstTrip.segments.length === 0) {
      console.warn(
        '[mapTrainOfferToLeg] Train offer has no trips or segments:',
        offer.id,
        offer,
      );
      return null;
    }

    const firstSegment: ApiOfferSegment = firstTrip.segments[0];
    const lastSegment: ApiOfferSegment =
      firstTrip.segments[firstTrip.segments.length - 1];

    const operatorName =
      firstSegment.vehicle?.name ||
      offer.metadata?.providerId ||
      'Unknown Train Operator';

    const departTime = firstSegment.departureAt; // Corrected field name
    const arriveTime = lastSegment.arrivalAt; // Corrected field name

    if (!departTime || !arriveTime) {
      console.warn(
        '[mapTrainOfferToLeg] Missing departure or arrival time for offer:',
        offer.id,
        firstSegment,
        lastSegment,
      );
      return null;
    }

    const priceStr = offer.price?.amount;
    if (typeof priceStr !== 'string' && typeof priceStr !== 'number') {
      // API might send number or string "123.45"
      console.warn(
        `[mapTrainOfferToLeg] Invalid or missing price amount for offer ${offer.id}:`,
        offer.price,
      );
      return null;
    }
    const priceInMinorUnits = Math.round(parseFloat(String(priceStr)) * 100);
    if (isNaN(priceInMinorUnits)) {
      console.warn(
        `[mapTrainOfferToLeg] Failed to parse price to minor units for offer ${offer.id}: ${priceStr}`,
      );
      return null;
    }

    return {
      id: offer.id,
      mode: 'train',
      operator: operatorName,
      from: getTrainPlaceInfo(originalDepartureStation),
      to: getTrainPlaceInfo(originalArrivalStation),
      depart: departTime,
      arrive: arriveTime,
      price: priceInMinorUnits,
      durationMinutes: calculateDurationMinutes(departTime, arriveTime),
    };
  } catch (e: any) {
    console.error(
      `[mapTrainOfferToLeg] Error processing train offer ${offer?.id}:`,
      e.message,
      offer,
      e.stack,
    );
    return null;
  }
}

export function mapFlightOfferToLeg(offer: ApiOffer): Leg | null {
  try {
    const firstTrip: ApiOfferTrip | undefined = offer.trips?.[0];
    if (!firstTrip || !firstTrip.segments || firstTrip.segments.length === 0) {
      console.warn(
        '[mapFlightOfferToLeg] Flight offer has no trips or segments:',
        offer.id,
        offer,
      );
      return null;
    }

    const firstSegment: ApiOfferSegment = firstTrip.segments[0];
    const lastSegment: ApiOfferSegment =
      firstTrip.segments[firstTrip.segments.length - 1];

    // Flight operator: owner.name is highest priority as per plan, then marketing_carrier, then operating_carrier
    const operatorName =
      offer.owner?.name ||
      firstSegment.marketing_carrier?.name ||
      firstSegment.operating_carrier?.name ||
      'Unknown Airline';

    const departTime = firstSegment.departureAt; // Corrected field name
    const arriveTime = lastSegment.arrivalAt; // Corrected field name

    if (!departTime || !arriveTime) {
      console.warn(
        '[mapFlightOfferToLeg] Missing departure or arrival time for offer:',
        offer.id,
        firstSegment,
        lastSegment,
      );
      return null;
    }

    const priceStr = offer.price?.amount;
    if (typeof priceStr !== 'string' && typeof priceStr !== 'number') {
      console.warn(
        `[mapFlightOfferToLeg] Invalid or missing price amount for offer ${offer.id}:`,
        offer.price,
      );
      return null;
    }
    const priceInMinorUnits = Math.round(parseFloat(String(priceStr)) * 100);
    if (isNaN(priceInMinorUnits)) {
      console.warn(
        `[mapFlightOfferToLeg] Failed to parse price to minor units for offer ${offer.id}: ${priceStr}`,
      );
      return null;
    }

    return {
      id: offer.id,
      mode: 'flight',
      operator: operatorName,
      from: getFlightPlaceInfo(firstSegment.origin as any), // Cast as any if type complains for origin/destination structure
      to: getFlightPlaceInfo(firstSegment.destination as any),
      depart: departTime,
      arrive: arriveTime,
      price: priceInMinorUnits,
      durationMinutes: calculateDurationMinutes(departTime, arriveTime),
    };
  } catch (e: any) {
    console.error(
      `[mapFlightOfferToLeg] Error processing flight offer ${offer?.id}:`,
      e.message,
      offer,
      e.stack,
    );
    return null;
  }
}
