import {
  Leg,
  ApiOffer,
  ApiOfferSlice,
  ApiOfferSegment,
  PlaceInfo,
  Itinerary,
} from '../types/multimodal';
import {v4 as uuidv4} from 'uuid';

function getPlaceInfo(
  apiPlace: {name: string; city_name?: string; [key: string]: any} | undefined,
  defaultNamePartForCity: string = 'Unknown',
): PlaceInfo {
  if (!apiPlace) {
    return {name: defaultNamePartForCity, city: defaultNamePartForCity};
  }
  // Prefer city_name, fallback to parsing name (e.g. "London King's Cross, London" or just "London King's Cross")
  // A more robust city extraction might be needed if city_name is often missing.
  const city =
    apiPlace.city_name ||
    apiPlace.name?.split(',')[0]?.trim() ||
    defaultNamePartForCity;
  return {
    name: apiPlace.name || defaultNamePartForCity,
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
      return undefined;
    }
    return Math.round(
      (arriveDate.getTime() - departDate.getTime()) / (1000 * 60),
    );
  } catch (e) {
    return undefined;
  }
}

const MIN_TRANSFER_MINUTES = 60;

function calculateTotalDuration(legs: Leg[]): number {
  if (!legs.length) {
    console.warn(
      '[calculateTotalDuration] Attempted to calculate duration for empty legs array.',
    );
    return 0;
  }

  // For a single leg, use its pre-calculated durationMinutes if available
  if (legs.length === 1) {
    if (legs[0].durationMinutes !== undefined) {
      return legs[0].durationMinutes;
    }
    // Fallback to calculating from depart/arrive if durationMinutes is missing
    try {
      const departDate = new Date(legs[0].depart);
      const arriveDate = new Date(legs[0].arrive);
      if (isNaN(departDate.getTime()) || isNaN(arriveDate.getTime())) {
        console.warn(
          '[calculateTotalDuration] Invalid date for single leg duration calculation:',
          legs[0].depart,
          legs[0].arrive,
        );
        return 0; // Or throw error
      }
      return Math.round(
        (arriveDate.getTime() - departDate.getTime()) / (1000 * 60),
      );
    } catch (e) {
      console.error(
        '[calculateTotalDuration] Error calculating single leg duration:',
        e,
      );
      return 0; // Or throw error
    }
  }

  // For multiple legs, it's from the first leg's departure to the last leg's arrival
  try {
    const firstDeparture = new Date(legs[0].depart).getTime();
    const lastArrival = new Date(legs[legs.length - 1].arrive).getTime();
    if (isNaN(firstDeparture) || isNaN(lastArrival)) {
      console.warn(
        '[calculateTotalDuration] Invalid date for multi-leg duration calculation.',
      );
      return 0; // Or throw error
    }
    return Math.round((lastArrival - firstDeparture) / (1000 * 60));
  } catch (e) {
    console.error(
      '[calculateTotalDuration] Error calculating multi-leg duration:',
      e,
    );
    return 0; // Or throw error
  }
}

export function mapTrainOfferToLeg(offer: ApiOffer): Leg {
  const firstSlice: ApiOfferSlice | undefined = offer.slices?.[0];
  if (!firstSlice) {
    console.error('Train offer has no slices:', offer.id);
    throw new Error('Train offer structure invalid: missing slices.');
  }

  const firstSegment: ApiOfferSegment | undefined = firstSlice.segments?.[0];
  const lastSegment: ApiOfferSegment | undefined =
    firstSlice.segments?.[firstSlice.segments.length - 1];

  if (!firstSegment || !lastSegment) {
    console.error('Train offer slice has no segments:', offer.id);
    throw new Error('Train offer slice structure invalid: missing segments.');
  }

  // Operator for trains: could be offer.owner.name or from segment details
  // This is a guess; actual API response structure for train operator needs verification.
  // Assuming owner.name might exist or a marketing_carrier on the segment.
  const operatorName =
    offer.owner?.name ||
    firstSegment.marketing_carrier?.name ||
    (offer as any).brand_name || // Example from some train APIs
    'Unknown Train Operator';

  const departTime = firstSegment.departing_at;
  const arriveTime = lastSegment.arriving_at;

  return {
    id: offer.id,
    mode: 'train',
    operator: operatorName,
    from: getPlaceInfo(firstSlice.origin, firstSlice.origin?.name),
    to: getPlaceInfo(firstSlice.destination, firstSlice.destination?.name),
    depart: departTime,
    arrive: arriveTime,
    price: offer.total_amount, // Assuming total_amount is in minor units
    durationMinutes: calculateDurationMinutes(departTime, arriveTime),
  };
}

export function mapFlightOfferToLeg(offer: ApiOffer): Leg {
  const firstSlice: ApiOfferSlice | undefined = offer.slices?.[0];
  if (!firstSlice) {
    console.error('Flight offer has no slices:', offer.id);
    throw new Error('Flight offer structure invalid: missing slices.');
  }

  const firstSegment: ApiOfferSegment | undefined = firstSlice.segments?.[0];
  const lastSegment: ApiOfferSegment | undefined =
    firstSlice.segments?.[firstSlice.segments.length - 1];

  if (!firstSegment || !lastSegment) {
    console.error('Flight offer slice has no segments:', offer.id);
    throw new Error('Flight offer slice structure invalid: missing segments.');
  }

  // Flight operator is typically offer.owner.name
  const operatorName =
    offer.owner?.name ||
    firstSegment.marketing_carrier?.name || // marketing_carrier common in flights
    'Unknown Airline';

  const departTime = firstSegment.departing_at;
  const arriveTime = lastSegment.arriving_at;

  return {
    id: offer.id,
    mode: 'flight',
    operator: operatorName,
    from: getPlaceInfo(firstSlice.origin, firstSlice.origin?.name),
    to: getPlaceInfo(firstSlice.destination, firstSlice.destination?.name),
    depart: departTime,
    arrive: arriveTime,
    price: offer.total_amount,
    durationMinutes: calculateDurationMinutes(departTime, arriveTime),
  };
}

export function buildMultimodalItineraries(
  trainLegs: Leg[],
  flightLegs: Leg[],
): Itinerary[] {
  const itineraries: Itinerary[] = [];
  console.log(
    '[itineraryBuilder] Building itineraries. Received Trains:',
    trainLegs.length,
    'Flights:',
    flightLegs.length,
  );

  // 1. Add direct train legs as itineraries
  trainLegs.forEach(trainLeg => {
    itineraries.push({
      id: `train_direct_${uuidv4()}`,
      legs: [trainLeg],
      totalDuration:
        trainLeg.durationMinutes ?? calculateTotalDuration([trainLeg]),
      totalPrice: trainLeg.price,
      transfers: 0,
    });
  });
  console.log(
    `[itineraryBuilder] Added ${trainLegs.length} direct train itineraries.`,
  );

  // 2. Add direct flight legs as itineraries
  flightLegs.forEach(flightLeg => {
    itineraries.push({
      id: `flight_direct_${uuidv4()}`,
      legs: [flightLeg],
      totalDuration:
        flightLeg.durationMinutes ?? calculateTotalDuration([flightLeg]),
      totalPrice: flightLeg.price,
      transfers: 0,
    });
  });
  console.log(
    `[itineraryBuilder] Added ${flightLegs.length} direct flight itineraries.`,
  );

  // 3. Combine: Train then Flight
  let trainThenFlightCount = 0;
  trainLegs.forEach(trainLeg => {
    flightLegs.forEach(flightLeg => {
      // Ensure city names are valid strings before comparing
      if (
        typeof trainLeg.to.city === 'string' &&
        typeof flightLeg.from.city === 'string' &&
        trainLeg.to.city.toLowerCase() === flightLeg.from.city.toLowerCase() &&
        trainLeg.to.city !== 'Unknown City' &&
        flightLeg.from.city !== 'Unknown City'
      ) {
        // Avoid matching on "Unknown City"

        try {
          const trainArrivalTime = new Date(trainLeg.arrive).getTime();
          const flightDepartureTime = new Date(flightLeg.depart).getTime();

          if (isNaN(trainArrivalTime) || isNaN(flightDepartureTime)) {
            console.warn(
              '[itineraryBuilder] Invalid date for train-flight transfer calculation. Train arrive:',
              trainLeg.arrive,
              'Flight depart:',
              flightLeg.depart,
            );
            return; // Skip this combination
          }

          const transferDurationMinutes =
            (flightDepartureTime - trainArrivalTime) / (1000 * 60);

          if (transferDurationMinutes >= MIN_TRANSFER_MINUTES) {
            const combinedLegs = [trainLeg, flightLeg];
            itineraries.push({
              id: `train_flight_${uuidv4()}`,
              legs: combinedLegs,
              totalDuration: calculateTotalDuration(combinedLegs),
              totalPrice: trainLeg.price + flightLeg.price,
              transfers: 1,
            });
            trainThenFlightCount++;
          }
        } catch (e) {
          console.error(
            '[itineraryBuilder] Error processing train-then-flight combination:',
            e,
            trainLeg,
            flightLeg,
          );
        }
      }
    });
  });
  console.log(
    `[itineraryBuilder] Added ${trainThenFlightCount} train-then-flight itineraries.`,
  );

  // 4. Combine: Flight then Train
  let flightThenTrainCount = 0;
  flightLegs.forEach(flightLeg => {
    trainLegs.forEach(trainLeg => {
      if (
        typeof flightLeg.to.city === 'string' &&
        typeof trainLeg.from.city === 'string' &&
        flightLeg.to.city.toLowerCase() === trainLeg.from.city.toLowerCase() &&
        flightLeg.to.city !== 'Unknown City' &&
        trainLeg.from.city !== 'Unknown City'
      ) {
        try {
          const flightArrivalTime = new Date(flightLeg.arrive).getTime();
          const trainDepartureTime = new Date(trainLeg.depart).getTime();

          if (isNaN(flightArrivalTime) || isNaN(trainDepartureTime)) {
            console.warn(
              '[itineraryBuilder] Invalid date for flight-train transfer calculation. Flight arrive:',
              flightLeg.arrive,
              'Train depart:',
              trainLeg.depart,
            );
            return; // Skip this combination
          }
          const transferDurationMinutes =
            (trainDepartureTime - flightArrivalTime) / (1000 * 60);

          if (transferDurationMinutes >= MIN_TRANSFER_MINUTES) {
            const combinedLegs = [flightLeg, trainLeg];
            itineraries.push({
              id: `flight_train_${uuidv4()}`,
              legs: combinedLegs,
              totalDuration: calculateTotalDuration(combinedLegs),
              totalPrice: flightLeg.price + trainLeg.price,
              transfers: 1,
            });
            flightThenTrainCount++;
          }
        } catch (e) {
          console.error(
            '[itineraryBuilder] Error processing flight-then-train combination:',
            e,
            flightLeg,
            trainLeg,
          );
        }
      }
    });
  });
  console.log(
    `[itineraryBuilder] Added ${flightThenTrainCount} flight-then-train itineraries.`,
  );

  const sortedItineraries = itineraries.sort(
    (a, b) => a.totalDuration - b.totalDuration,
  );
  console.log(
    '[itineraryBuilder] Total itineraries built and sorted:',
    sortedItineraries.length,
  );
  return sortedItineraries;
}
