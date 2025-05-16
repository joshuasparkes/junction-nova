import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types';
import {Place, Flight, ListFlightOffersResponse} from '../../types';
import PlaceInput from '../../components/PlaceInput';
import DatePickerInput from '../../components/DatePickerInput';
import FlightResultsList from '../../components/FlightResultsList';
import {
  formatDateForApi,
  transformApiFlightOfferToFlight,
} from '../../utils/flightUtils';
import {
  formStyles,
  buttonStyles,
  screenStyles,
  colors,
} from '../../styles/commonStyles';

type FlightSearchScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightSearch'
>;

const getDefaultDepartureDate = () => {
  return new Date(2025, 7, 24);
};

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = 12; // 5s * 12 = 60 seconds total polling time

const FlightSearchScreen = () => {
  const navigation = useNavigation<FlightSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Flight[]>([]);
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
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    getDefaultDepartureDate(),
  );
  const [passengerCount, setPassengerCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // Keep for visual, but it won't be tied to a fixed API delay anymore

  const [apiKey] = useState<string>('jk_live_01j8r3grxbeve8ta0h1t5qbrvx');
  const currentPollAttempt = React.useRef(0); // Ref to track polling attempts

  // Effect for loading progress bar - this will now reflect polling duration
  React.useEffect(() => {
    let progressIntervalId: NodeJS.Timeout | null = null;
    if (isLoading) {
      setLoadingProgress(0);
      const totalApproximatePollingTime =
        POLLING_INTERVAL * MAX_POLLING_ATTEMPTS;

      progressIntervalId = setInterval(() => {
        // Update progress based on current attempt vs max attempts
        const progress = Math.min(
          currentPollAttempt.current / MAX_POLLING_ATTEMPTS,
          1,
        );
        setLoadingProgress(progress);

        if (progress >= 1) {
          if (progressIntervalId) {
            clearInterval(progressIntervalId);
          }
        }
      }, POLLING_INTERVAL / 5); // Update visual progress more frequently than polling
    } else {
      if (progressIntervalId) {
        clearInterval(progressIntervalId);
      }
      setLoadingProgress(0);
      currentPollAttempt.current = 0; // Reset poll attempt count
    }
    return () => {
      if (progressIntervalId) {
        clearInterval(progressIntervalId);
      }
    };
  }, [isLoading]);

  const fetchPlaces = async (
    inputText: string,
    type: 'departure' | 'arrival',
  ) => {
    if (inputText.length === 0) {
      if (type === 'departure') {
        setDeparturePlaceSuggestions([]);
        setSelectedDeparturePlace(null);
      } else {
        setArrivalPlaceSuggestions([]);
        setSelectedArrivalPlace(null);
      }
      return;
    }
    if (inputText.length !== 3) {
      if (type === 'departure') {
        setDeparturePlaceSuggestions([]);
      } else {
        setArrivalPlaceSuggestions([]);
      }
      return;
    }

    const url = `https://content-api.sandbox.junction.dev/places?filter[iata][eq]=${encodeURIComponent(
      inputText.toUpperCase(),
    )}&page[limit]=5`;

    console.log(`Fetching place by IATA: ${inputText.toUpperCase()}`);

    const headers = {
      'x-api-key': apiKey,
      Accept: 'application/json',
    };

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

  const pollForOffers = async (
    flightSearchId: string,
  ): Promise<ListFlightOffersResponse | null> => {
    const getOffersUrl = `https://content-api.sandbox.junction.dev/flight-searches/${flightSearchId}/offers`;
    console.log(
      `Polling attempt ${
        currentPollAttempt.current + 1
      } for offers: ${getOffersUrl}`,
    );

    const getOffersResponse = await fetch(getOffersUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      cache: 'no-store',
    });

    console.log(`Polling Response Status: ${getOffersResponse.status}`);
    const responseContentType = getOffersResponse.headers.get('content-type');
    console.log(`Polling Response Content-Type: ${responseContentType}`);

    if (getOffersResponse.status === 200) {
      const responseText = await getOffersResponse.text();
      console.log(
        'Polling successful (200 OK). Raw response text:',
        responseText,
      );
      if (
        responseText &&
        responseText.trim().startsWith('{') &&
        responseText.trim().endsWith('}')
      ) {
        try {
          return JSON.parse(responseText) as ListFlightOffersResponse;
        } catch (parseError) {
          console.error(
            'Error parsing flight offers JSON during polling:',
            parseError,
            'Raw text was:',
            `"${responseText}"`,
          );
          throw new Error('Failed to parse offers data.'); // Or handle as no offers
        }
      } else {
        console.log(
          `Received 200 OK but non-JSON or empty response body during polling. Raw text: "${responseText}"`,
        );
        return null; // Treat as no offers found or handle as error
      }
    } else if (getOffersResponse.status === 202) {
      currentPollAttempt.current++;
      if (currentPollAttempt.current < MAX_POLLING_ATTEMPTS) {
        console.log(
          `Status 202 (Accepted). Waiting ${
            POLLING_INTERVAL / 1000
          }s before next poll.`,
        );
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        return pollForOffers(flightSearchId); // Recursive call
      } else {
        console.log('Max polling attempts reached.');
        throw new Error(
          'Max polling attempts reached. Offers did not become available.',
        );
      }
    } else {
      // Handle other error statuses (4xx, 5xx)
      const errorText = await getOffersResponse.text();
      console.error(
        `Failed to get flight offers during polling. Status: ${getOffersResponse.status}`,
        `URL: ${getOffersUrl}`,
        `Response: ${errorText}`,
      );
      throw new Error(
        `Failed to fetch offers. Status: ${getOffersResponse.status}`,
      );
    }
  };

  const handleSearch = async () => {
    if (!selectedDeparturePlace || !selectedArrivalPlace || !departureDate) {
      alert('Please select departure, arrival places and a departure date.');
      return; // No need to set isLoading if validation fails early
    }
    if (!selectedDeparturePlace.id || !selectedArrivalPlace.id) {
      alert(
        'Departure or destination ID is missing. Please re-select the places.',
      );
      return;
    }

    setIsLoading(true);
    setResultsData([]);
    currentPollAttempt.current = 0; // Reset poll count for new search

    try {
      const formattedDepartureDate = formatDateForApi(departureDate);
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
        throw new Error(
          `Error creating flight search: ${createSearchResponse.status}. ${errorText}`,
        );
      }

      const locationHeader = createSearchResponse.headers.get('Location');
      if (!locationHeader) {
        throw new Error(
          'Location header missing in create flight search response.',
        );
      }

      const flightSearchIdMatch = locationHeader.match(
        /flight-searches\/(flight_search_[a-zA-Z0-9]+)/,
      );
      const flightSearchId = flightSearchIdMatch?.[1];
      if (!flightSearchId) {
        throw new Error(
          `Could not extract flightSearchId from Location header: ${locationHeader}`,
        );
      }

      console.log('Extracted flightSearchId:', flightSearchId);
      console.log('Starting to poll for offers...');

      const offersData = await pollForOffers(flightSearchId);

      console.log(
        'Polling finished. Parsed flight offers data:',
        JSON.stringify(offersData, null, 2),
      );

      if (offersData && offersData.items && offersData.items.length > 0) {
        const transformedFlights = offersData.items.map(
          transformApiFlightOfferToFlight,
        );
        setResultsData(transformedFlights);
      } else {
        setResultsData([]);
        console.log(
          'No flight offers found after polling or data was null/empty.',
        );
        // Optionally show a more specific message to the user here
      }
      setShowResults(true);
    } catch (error: any) {
      console.error('Flight search process error:', error);
      Alert.alert(
        'Search Error',
        error.message || 'An unexpected error occurred during flight search.',
      );
      setShowResults(false); // Don't show empty results screen on critical error
      setResultsData([]);
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
    setDepartureDate(getDefaultDepartureDate());
    setPassengerCount('1');
    setIsLoading(false);
  };

  const handleSelectFlight = (flight: Flight) => {
    if (flight && flight.id) {
      navigation.navigate('FlightBooking', {flight: flight});
    } else {
      console.warn(
        'Selected flight has no ID or is undefined, cannot navigate to booking.',
      );
      alert('Cannot proceed with booking: selected flight data is incomplete.');
    }
  };

  if (showResults) {
    return (
      <View style={screenStyles.container}>
        <FlightResultsList
          results={resultsData}
          onNewSearch={handleNewSearch}
          onSelectFlight={handleSelectFlight}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <Text style={screenStyles.loadingText}>Searching for flights...</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {width: `${loadingProgress * 100}%`},
            ]}
          />
        </View>
        {/* <Text style={screenStyles.loadingText}>{`${Math.round(loadingProgress * 100)}%`}</Text> */}
      </View>
    );
  }

  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>Search Flights</Text>

      <PlaceInput
        placeholder="Departure IATA Code (e.g., CDG)"
        inputText={departureInputText}
        suggestions={departurePlaceSuggestions}
        onInputChange={text => {
          setDepartureInputText(text);
          if (text.length === 0) {
            setDeparturePlaceSuggestions([]);
            setSelectedDeparturePlace(null);
          }
        }}
        onFetchSuggestions={text => fetchPlaces(text, 'departure')}
        onSelectPlace={place => {
          setDepartureInputText(place.name);
          setSelectedDeparturePlace(place);
          setDeparturePlaceSuggestions([]);
        }}
      />

      <PlaceInput
        placeholder="Arrival IATA Code (e.g., JFK)"
        inputText={arrivalInputText}
        suggestions={arrivalPlaceSuggestions}
        onInputChange={text => {
          setArrivalInputText(text);
          if (text.length === 0) {
            setArrivalPlaceSuggestions([]);
            setSelectedArrivalPlace(null);
          }
        }}
        onFetchSuggestions={text => fetchPlaces(text, 'arrival')}
        onSelectPlace={place => {
          setArrivalInputText(place.name);
          setSelectedArrivalPlace(place);
          setArrivalPlaceSuggestions([]);
        }}
      />

      <DatePickerInput
        placeholder="Departure date (YYYY-MM-DD)"
        value={departureDate}
        onChange={setDepartureDate}
        minimumDate={new Date()}
      />

      <TextInput
        style={formStyles.input}
        placeholder="Return date (optional)"
      />
      <TextInput
        style={formStyles.input}
        placeholder="Passengers (e.g., 1)"
        keyboardType="number-pad"
        value={passengerCount}
        onChangeText={setPassengerCount}
      />
      <TouchableOpacity style={buttonStyles.primary} onPress={handleSearch}>
        <Text style={buttonStyles.primaryText}>Search Flights</Text>
      </TouchableOpacity>
    </View>
  );
};

// Add new styles for the progress bar
const styles = {
  progressBarContainer: {
    height: 20,
    width: '80%',
    backgroundColor: colors.inputBorder, // A light grey for the background of the bar
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 10,
    overflow: 'hidden', // Ensures the fill stays within the rounded corners
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary, // Use your primary color for the fill
    borderRadius: 10, // Match container's border radius
  },
};

export default FlightSearchScreen;
