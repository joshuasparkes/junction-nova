import {ListOffersResponse, ApiOffer, ApiPlace} from '../types/multimodal'; // Assuming types are in ../types/multimodal.ts

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
): Promise<{searchId: string; type: 'train' | 'flight'}> {
  const url = `${BASE_URL}/${type}-searches`;
  const body = {
    originId,
    destinationId,
    departureAfter,
    returnDepartureAfter: null, // As per plan
    passengerAges: [{dateOfBirth: passengerDob}], // Plan: passengerAges: [{ dateOfBirth: ISODateString }]
  };

  console.log(
    `[initiateSearch] Initiating ${type} search to ${url} with body:`,
    JSON.stringify(body, null, 2),
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseStatus = response.status;
  console.log(
    `[initiateSearch] Response status for ${type} search: ${responseStatus}`,
  );

  // Accept both 201 Created and 202 Accepted
  if (responseStatus !== 201 && responseStatus !== 202) {
    const errorText = await response.text();
    console.error(
      `[initiateSearch] Failed to initiate ${type} search: ${responseStatus}`,
      errorText,
    );
    throw new Error(
      `Failed to initiate ${type} search: ${responseStatus}. Body: ${errorText}`,
    );
  }

  const locationHeader = response.headers.get('Location');
  console.log(
    `[initiateSearch] Location header for ${type} search (${responseStatus}): ${locationHeader}`,
  );

  if (!locationHeader) {
    throw new Error(
      `Location header missing in ${type} search initiation response (status ${responseStatus}).`,
    );
  }

  // Original regex: /train-searches\/(train_search_[a-zA-Z0-9]+)/
  // This regex should capture 'train_search_xxxx' or 'flight_search_xxxx'
  // even if the locationHeader is '/train-searches/train_search_xxxx/offers'
  // or just '/train-searches/train_search_xxxx'
  const searchIdMatch = locationHeader.match(
    // Using a more general regex that captures the ID directly after the type-searches/ part
    // It handles cases where /offers might be appended or not.
    new RegExp(`${type}-searches\\/(${type}_search_[a-zA-Z0-9]+)`),
  );
  const searchId = searchIdMatch?.[1];

  if (!searchId) {
    console.error(
      `[initiateSearch] Could not parse ${type}SearchId from Location header: ${locationHeader}. Match object:`,
      searchIdMatch,
    );
    throw new Error(
      `Could not parse ${type}SearchId from Location header: ${locationHeader}`,
    );
  }

  console.log(`[initiateSearch] Extracted ${type}SearchId: ${searchId}`);
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

  console.log(`[pollOffers] Polling for ${type} offers at ${offersUrl}...`);

  while (attempts < MAX_POLLING_ATTEMPTS && !offersFound) {
    attempts++;
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
    console.log(
      `[pollOffers] Polling attempt ${attempts} for ${type} search ID ${searchId}...`,
    );

    try {
      const response = await fetch(offersUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          Accept: 'application/json',
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(
          `[pollOffers] Attempt ${attempts} - Failed to get ${type} offers: ${response.status}`,
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
          `[pollOffers] Attempt ${attempts} - Empty response body for ${type} offers. Status: ${response.status}. Continuing to poll.`,
        );
        if (response.status === 204 && attempts === MAX_POLLING_ATTEMPTS) {
          console.log(
            `[pollOffers] Polling timeout for ${type} offers: received 204 No Content on final attempt.`,
          );
          return [];
        }
        continue;
      }

      const parsedData: ListOffersResponse = JSON.parse(responseText);

      if (parsedData && parsedData.items && parsedData.items.length > 0) {
        offersData = parsedData.items;
        offersFound = true;
        console.log(
          `[pollOffers] Attempt ${attempts} - ${type} offers found for ${searchId}! Count: ${offersData.length}`,
        );
      } else {
        console.log(
          `[pollOffers] Attempt ${attempts} - Offers response OK but no items found for ${type} search ID ${searchId}.`,
        );
      }
    } catch (error: any) {
      // Catch any error type
      console.error(
        `[pollOffers] Attempt ${attempts} - Error during polling for ${type} offers (${searchId}):`,
        error,
      );
      if (attempts === MAX_POLLING_ATTEMPTS) {
        throw new Error(
          `Failed to get or parse ${type} offers for ${searchId} after ${attempts} attempts: ${
            error.message || error
          }`,
        );
      }
    }
  }

  if (!offersFound) {
    console.log(
      `[pollOffers] No ${type} offers found for ${searchId} after ${MAX_POLLING_ATTEMPTS} attempts.`,
    );
  }
  return offersData;
}

// Helper for place search (as discussed in thought process)
// This will be used in MultimodalSearchScreen.tsx
export async function fetchPlacesApi(query: string): Promise<ApiPlace[]> {
  const headers = {Accept: 'application/json', 'x-api-key': API_KEY};
  const encodedQuery = encodeURIComponent(query);
  const limit = 5; // Consistent with TrainSearchScreen if it uses a limit

  const stationUrl = `${BASE_URL}/places?filter[type][eq]=railway-station&filter[name][like]=${encodedQuery}&page[limit]=${limit}`;
  const airportUrl = `${BASE_URL}/places?filter[type][eq]=airport&filter[name][like]=${encodedQuery}&page[limit]=${limit}`;

  console.log(`[fetchPlacesApi] Fetching stations URL: ${stationUrl}`);
  console.log(`[fetchPlacesApi] Fetching airports URL: ${airportUrl}`);

  try {
    const [stationResponse, airportResponse] = await Promise.all([
      fetch(stationUrl, {headers}),
      fetch(airportUrl, {headers}),
    ]);

    const stationJson = stationResponse.ok
      ? await stationResponse.json()
      : {items: []};
    const airportJson = airportResponse.ok
      ? await airportResponse.json()
      : {items: []};

    console.log('[fetchPlacesApi] Station JSON response:', stationJson);
    console.log('[fetchPlacesApi] Airport JSON response:', airportJson);

    const stations: ApiPlace[] = (stationJson.items || []).map((s: any) => ({
      id: s.id || `station_${s.name}_${Date.now()}`, // Fallback id
      name: s.name || 'Unknown Station',
      type: 'railway-station',
      iataCode: s.iataCode, // Used by PlaceInput if available
      countryCode: s.countryCode, // Used by PlaceInput
      cityName: s.cityName,
      stationCode: s.stationCode,
    }));
    const airports: ApiPlace[] = (airportJson.items || []).map((a: any) => ({
      id: a.id || `airport_${a.name}_${Date.now()}`, // Fallback id
      name: a.name || 'Unknown Airport',
      type: 'airport',
      iataCode: a.iataCode,
      countryCode: a.countryCode,
      cityName: a.cityName,
    }));

    const combinedPlaces = [...stations, ...airports];
    console.log(
      `[fetchPlacesApi] Combined places count: ${combinedPlaces.length}. Places:`,
      combinedPlaces,
    );
    return combinedPlaces;
  } catch (error) {
    console.error('[fetchPlacesApi] Failed to fetch places from API:', error);
    return [];
  }
}
