import {ApiFlightOffer, Flight} from '../types'; // Import necessary types

export const formatApiTime = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const calculateDuration = (
  departureAt: string,
  arrivalAt: string,
): string => {
  try {
    const departure = new Date(departureAt).getTime();
    const arrival = new Date(arrivalAt).getTime();
    const diffMs = arrival - departure;
    if (isNaN(diffMs) || diffMs < 0) {
      return 'N/A';
    }
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  } catch (e) {
    return 'N/A';
  }
};

export const transformApiFlightOfferToFlight = (
  offer: ApiFlightOffer,
): Flight => {
  const firstTrip = offer.trips?.[0];
  const firstSegment = firstTrip?.segments?.[0];

  return {
    id: offer.id,
    airline: firstSegment?.fare?.marketingName || 'Unknown Airline',
    from: firstSegment?.origin?.iataCode || firstSegment?.origin?.name || 'N/A',
    to:
      firstSegment?.destination?.iataCode ||
      firstSegment?.destination?.name ||
      'N/A',
    departureTime: firstSegment
      ? formatApiTime(firstSegment.departureAt)
      : 'N/A',
    arrivalTime: firstSegment ? formatApiTime(firstSegment.arrivalAt) : 'N/A',
    duration: firstSegment
      ? calculateDuration(firstSegment.departureAt, firstSegment.arrivalAt)
      : 'N/A',
    price: `${offer.price.amount} ${offer.price.currency}`,
    stops:
      (firstTrip?.segments?.length || 0) <= 1
        ? 'Direct'
        : `${(firstTrip?.segments?.length || 1) - 1}+ Stops`,
  };
};

export const formatDateForApi = (date: Date | undefined): string => {
  if (!date) {
    return '';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
