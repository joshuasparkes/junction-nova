import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types';
import {mockFlightsData, Flight} from '../../data/mockData';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

// Define Place types based on API schema
interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

interface Place {
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

// interface PlacesApiResponse { // We might need this later for full response typing
//   items: Place[];
//   // ... other fields like links, meta
// }

// --- New Types for Flight Offers ---
interface FlightPrice {
  currency: string;
  amount: string;
}

interface FlightPriceBreakdown {
  price: FlightPrice;
  breakdownType: string; // "tax", "base-fare", etc.
}

interface FlightSegmentPlace {
  placeId: string;
  name: string;
  iataCode: string;
  coordinates: PlaceCoordinates;
}

interface FlightFare {
  type: string; // "economy", "first", etc.
  marketingName: string;
}

interface FlightSegment {
  origin: FlightSegmentPlace;
  destination: FlightSegmentPlace;
  departureAt: string; // ISO date string
  arrivalAt: string; // ISO date string
  fare: FlightFare;
}

interface FlightTrip {
  segments: FlightSegment[];
}

interface ApiFlightOffer {
  // Renamed to avoid conflict with existing Flight if needed
  id: string;
  expiresAt: string; // ISO date string
  price: FlightPrice;
  priceBreakdown: FlightPriceBreakdown[];
  passportInformation: string; // "required", "not_required", etc.
  trips: FlightTrip[];
}

interface ListFlightOffersResponse {
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
// --- End of New Types ---

type FlightSearchScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightSearch'
>;

const FlightSearchScreen = () => {
  const navigation = useNavigation<FlightSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Flight[]>([]);

  // State for Places API integration
  const [departureInputText, setDepartureInputText] = useState('');
  const [arrivalInputText, setArrivalInputText] = useState('');
  const [departurePlaceSuggestions, setDeparturePlaceSuggestions] = useState<
    Place[]
  >([]);
  const [arrivalPlaceSuggestions, setArrivalPlaceSuggestions] = useState<
    Place[]
  >([]);
  const [selectedDeparturePlace, setSelectedDeparturePlace] =
    useState<Place | null>(null);
  const [selectedArrivalPlace, setSelectedArrivalPlace] =
    useState<Place | null>(null);

  // --- New State for Flight Search Criteria ---
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [passengerCount, setPassengerCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false); // For loading indicator

  const [apiKey] = useState<string>('jk_live_01j8r3grxbeve8ta0h1t5qbrvx');

  // Helper function to format date to just time HH:MM
  const formatApiTime = (isoDateString: string): string => {
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

  // Helper function to calculate duration (simplified)
  const calculateDuration = (
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

  // Helper function to transform ApiFlightOffer to Flight
  const transformApiFlightOfferToFlight = (offer: ApiFlightOffer): Flight => {
    // Assuming the first trip and first segment for simplicity
    const firstTrip = offer.trips?.[0];
    const firstSegment = firstTrip?.segments?.[0];

    return {
      id: offer.id,
      airline: firstSegment?.fare?.marketingName || 'Unknown Airline', // Use marketing name or a default
      from:
        firstSegment?.origin?.iataCode || firstSegment?.origin?.name || 'N/A',
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
      // Simplified stops logic: "Direct" if 1 segment, otherwise "1+ Stops"
      stops:
        (firstTrip?.segments?.length || 0) <= 1
          ? 'Direct'
          : `${(firstTrip?.segments?.length || 1) - 1}+ Stops`,
    };
  };

  const fetchPlaces = async (
    inputText: string,
    type: 'departure' | 'arrival',
  ) => {
    // IATA codes are 3 characters long.
    // If we only search by IATA, only proceed if input is 3 chars.
    if (inputText.length !== 3) {
      if (type === 'departure') {
        setDeparturePlaceSuggestions([]);
      } else {
        setArrivalPlaceSuggestions([]);
      }
      // Optionally, you could add a check here to see if it's uppercase letters too,
      // but the API might be case-insensitive for IATA codes.
      // For now, just checking length.
      return;
    }

    // Always search by IATA code
    const url = `https://content-api.sandbox.junction.dev/places?filter[iata][eq]=${encodeURIComponent(
      inputText.toUpperCase(), // Convert to uppercase as IATA codes are generally uppercase
    )}&page[limit]=5`; // Limit results, though for IATA it's often 1.

    console.log(`Fetching place by IATA: ${inputText.toUpperCase()}`);

    const headers = {
      'x-api-key': apiKey,
      Accept: 'application/json',
    };

    // console.log('Fetching places with URL:', url); // Optional: for debugging
    // console.log('Fetching places with headers:', headers); // Optional: for debugging

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        console.error('API call failed with status:', response.status);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        if (type === 'departure') {
          setDeparturePlaceSuggestions([]);
        } else {
          setArrivalPlaceSuggestions([]);
        }
        return;
      }

      const data = await response.json();
      // console.log(`Places API response for ${type} ('${inputText}'):`, data); // Optional: for debugging

      if (data && data.items) {
        if (type === 'departure') {
          setDeparturePlaceSuggestions(data.items);
        } else {
          setArrivalPlaceSuggestions(data.items);
        }
      } else {
        if (type === 'departure') {
          setDeparturePlaceSuggestions([]);
        } else {
          setArrivalPlaceSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      if (type === 'departure') {
        setDeparturePlaceSuggestions([]);
      } else {
        setArrivalPlaceSuggestions([]);
      }
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const formatDateForApi = (date: Date | undefined): string => {
    if (!date) {
      return '';
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSearch = async () => {
    if (!selectedDeparturePlace || !selectedArrivalPlace) {
      alert('Please select both departure and arrival locations.');
      return;
    }
    const formattedDepartureDate = formatDateForApi(departureDate);

    if (!formattedDepartureDate) {
      alert('Please enter a departure date.');
      return;
    }

    setIsLoading(true);
    setResultsData([]);

    try {
      const createSearchUrl =
        'https://content-api.sandbox.junction.dev/flight-searches';
      const departureDateTime = `${formattedDepartureDate}T14:15:22Z`;

      const numPassengers = parseInt(passengerCount, 10) || 1;
      const passengerAgesPayload = Array(numPassengers).fill({
        dateOfBirth: '2000-01-01',
      });

      const createSearchBody = {
        originId: selectedDeparturePlace.id,
        destinationId: selectedArrivalPlace.id,
        departureAfter: departureDateTime,
        passengerAges: passengerAgesPayload,
      };

      console.log(
        'Creating flight search with body:',
        JSON.stringify(createSearchBody, null, 2),
      );

      const createSearchResponse = await fetch(createSearchUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createSearchBody),
      });

      if (!createSearchResponse.ok) {
        const errorText = await createSearchResponse.text();
        console.error(
          'Failed to create flight search:',
          createSearchResponse.status,
          errorText,
        );
        alert(
          `Error creating flight search: ${createSearchResponse.status}. ${errorText}`,
        );
        setIsLoading(false);
        return;
      }

      const locationHeader = createSearchResponse.headers.get('Location');
      if (!locationHeader) {
        console.error(
          'Location header missing in create flight search response',
        );
        alert('Failed to get flight search ID. Location header missing.');
        setIsLoading(false);
        return;
      }

      const flightSearchIdMatch = locationHeader.match(
        /flight-searches\/(flight_search_[a-zA-Z0-9]+)\/offers/,
      );
      const flightSearchId = flightSearchIdMatch?.[1];

      if (!flightSearchId) {
        console.error(
          'Could not parse flightSearchId from Location header:',
          locationHeader,
        );
        alert('Failed to parse flight search ID.');
        setIsLoading(false);
        return;
      }
      console.log('Extracted flightSearchId:', flightSearchId);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const getOffersUrl = `https://content-api.sandbox.junction.dev/flight-searches/${flightSearchId}/offers`;
      console.log('Fetching flight offers from:', getOffersUrl);

      const getOffersResponse = await fetch(getOffersUrl, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
      });

      const responseText = await getOffersResponse.text();
      console.log('Raw response text from getOffers:', responseText);

      if (!getOffersResponse.ok) {
        console.error(
          'Failed to get flight offers (status not ok):',
          getOffersResponse.status,
          responseText,
        );
        alert(
          `Error fetching flight offers: ${getOffersResponse.status}. ${responseText}`,
        );
        setIsLoading(false);
        return;
      }

      let offersData: ListFlightOffersResponse | null = null;
      if (responseText) {
        try {
          offersData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse flight offers JSON:', parseError);
          console.error('Original response text was:', responseText);
          alert(
            'Error parsing flight offers response. The data might be invalid.',
          );
          setIsLoading(false);
          return;
        }
      } else {
        console.log('Received empty response body for flight offers.');
      }

      console.log(
        'Parsed flight offers data:',
        JSON.stringify(offersData, null, 2),
      );

      if (offersData && offersData.items && offersData.items.length > 0) {
        const transformedFlights = offersData.items.map(
          transformApiFlightOfferToFlight,
        );
        setResultsData(transformedFlights);
      } else {
        setResultsData([]);
        console.log('No flight offers found.');
      }
      setShowResults(true);
    } catch (error) {
      console.error('Error during flight search process:', error);
      alert(
        'An unexpected error occurred during the flight search. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setResultsData([]);
    setDepartureInputText('');
    setArrivalInputText('');
    setSelectedDeparturePlace(null);
    setSelectedArrivalPlace(null);
    setDeparturePlaceSuggestions([]);
    setArrivalPlaceSuggestions([]);
    setDepartureDate(undefined);
    setShowDatePicker(false);
    setPassengerCount('1');
    setIsLoading(false);
  };

  const renderResultItem = ({item}: {item: Flight}) => {
    return (
      <View style={styles.resultItemCard}>
        <Text style={styles.resultItemTitle}>
          {item.airline}: {item.from} to {item.to}
        </Text>
        <Text style={styles.resultItemDetail}>
          Departure: {item.departureTime} - Arrival: {item.arrivalTime}
        </Text>
        <Text style={styles.resultItemDetail}>
          Duration: {item.duration} ({item.stops})
        </Text>
        <Text style={styles.resultItemPrice}>{item.price}</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('FlightBooking', {flight: item})}>
          <Text style={styles.bookButtonText}>Book Flight</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPlaceSuggestionItem = ({
    item,
    type,
  }: {
    item: Place;
    type: 'departure' | 'arrival';
  }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        if (type === 'departure') {
          setDepartureInputText(item.name);
          setSelectedDeparturePlace(item);
          setDeparturePlaceSuggestions([]);
        } else {
          setArrivalInputText(item.name);
          setSelectedArrivalPlace(item);
          setArrivalPlaceSuggestions([]);
        }
      }}>
      <Text style={styles.suggestionText}>
        {item.name} ({item.iataCode || item.countryCode})
      </Text>
    </TouchableOpacity>
  );

  if (showResults) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenTitle}>Flight Results</Text>
        {resultsData.length > 0 ? (
          <FlatList
            data={resultsData}
            renderItem={renderResultItem}
            keyExtractor={item => item.id}
            style={styles.resultsList}
          />
        ) : (
          <Text style={styles.placeholderText}>
            No results found for Flights.
          </Text>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNewSearch}>
          <Text style={styles.primaryButtonText}>New Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.screenContainer, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Searching for flights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Search Flights</Text>

      <TextInput
        style={styles.input}
        placeholder="Departure city/airport"
        placeholderTextColor="#999999"
        value={departureInputText}
        onChangeText={text => {
          setDepartureInputText(text);
          if (text.length === 0) {
            setDeparturePlaceSuggestions([]);
            setSelectedDeparturePlace(null);
          } else {
            fetchPlaces(text, 'departure');
          }
        }}
      />
      {departurePlaceSuggestions.length > 0 && (
        <FlatList
          data={departurePlaceSuggestions}
          renderItem={props =>
            renderPlaceSuggestionItem({...props, type: 'departure'})
          }
          keyExtractor={item => item.id}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Arrival city/airport"
        placeholderTextColor="#999999"
        value={arrivalInputText}
        onChangeText={text => {
          setArrivalInputText(text);
          if (text.length === 0) {
            setArrivalPlaceSuggestions([]);
            setSelectedArrivalPlace(null);
          } else {
            fetchPlaces(text, 'arrival');
          }
        }}
      />
      {arrivalPlaceSuggestions.length > 0 && (
        <FlatList
          data={arrivalPlaceSuggestions}
          renderItem={props =>
            renderPlaceSuggestionItem({...props, type: 'arrival'})
          }
          keyExtractor={item => item.id}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <TouchableOpacity
        style={styles.inputTouchable}
        onPress={() => setShowDatePicker(true)}>
        <Text
          style={[
            styles.datePickerText,
            !departureDate && styles.datePickerPlaceholderText,
          ]}>
          {departureDate
            ? formatDateForApi(departureDate)
            : 'Departure date (YYYY-MM-DD)'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={departureDate || new Date()}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      <TextInput style={styles.input} placeholder="Return date (optional)" />
      <TextInput
        style={styles.input}
        placeholder="Passengers (e.g., 1)"
        keyboardType="number-pad"
        value={passengerCount}
        onChangeText={setPassengerCount}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
        <Text style={styles.primaryButtonText}>Search Flights</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#022E79',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  primaryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
  },
  primaryButtonText: {
    color: '#022E79',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsList: {
    width: '100%',
    marginTop: 10,
  },
  resultItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  resultItemDetail: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 3,
  },
  resultItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#022E79',
    marginTop: 8,
    textAlign: 'right',
    marginBottom: 10,
  },
  bookButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 20,
  },
  suggestionsList: {
    width: '90%',
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 0,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333333',
  },
  loadingContainer: {
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inputTouchable: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    minHeight: 48,
  },
  datePickerText: {
    fontSize: 16,
    color: '#000000',
  },
  datePickerPlaceholderText: {
    fontSize: 16,
    color: '#999999',
  },
});

export default FlightSearchScreen;
