import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform, // Added for consistency
} from 'react-native';
// import {StackNavigationProp} from '@react-navigation/stack'; // Already have this
// import {TrainStackParamList} from '../../navigation/types'; // Already have this
import {
  Place,
  Train,
  ApiTrainOffer,
  ListTrainOffersResponse,
} from '../../types';
import {
  formatDateForApi,
  calculateDuration,
  formatApiTime,
} from '../../utils/flightUtils'; // Assuming these utils are generic enough
import PlaceInput from '../../components/PlaceInput';
import DatePickerInput from '../../components/DatePickerInput';
import TrainResultsList from '../../components/TrainResultsList';
import {
  screenStyles,
  formStyles,
  buttonStyles,
  colors,
} from '../../styles/commonStyles';

// type TrainSearchScreenNavigationProp = StackNavigationProp< // Already defined
//   TrainStackParamList,
//   'TrainSearch'
// >;

const API_BASE = Platform.select({
  ios: 'http://192.168.1.22:4000',
  android: 'http://10.0.2.2:4000',
  default: 'http://192.168.1.22:4000',
});
const TrainSearchScreen = () => {
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Train[]>([]);
  const [departureStationText, setDepartureStationText] = useState('');
  const [arrivalStationText, setArrivalStationText] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    new Date(2025, 5, 24), // Note: JavaScript months are 0-indexed, so 5 is June.
  );
  const [passengerCount, setPassengerCount] = useState('1');
  const [departureStationSuggestions, setDepartureStationSuggestions] =
    useState<Place[]>([]);
  const [arrivalStationSuggestions, setArrivalStationSuggestions] = useState<
    Place[]
  >([]);
  const [selectedDepartureStation, setSelectedDepartureStation] =
    useState<Place | null>(null);
  const [selectedArrivalStation, setSelectedArrivalStation] =
    useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // No need for apiKey in frontend anymore

  // ADD THIS LOG: To see showResults on every render
  console.log(
    `TrainSearchScreen rendering cycle. isLoading: ${isLoading}, showResults: ${showResults}`,
  );

  useEffect(() => {
    // Pre-fill logic can remain for testing if desired
    const testOriginId = 'place_01j804c5h1ew3ask9eh2znw3pz'; // Example: London St Pancras
    const testDestinationId = 'place_01j804922hfcws9mffxbj8tsv3'; // Example: Paris Gare du Nord
    const originStationName = 'London St Pancras Intl';
    const destinationStationName = 'Paris Gare du Nord';
    setSelectedDepartureStation({
      id: testOriginId,
      name: originStationName,
      placeTypes: ['railway-station'],
      coordinates: {latitude: 0, longitude: 0}, // Dummy coords
      countryCode: 'GB',
      countryName: 'UK',
      iataCode: null,
      timeZone: 'Europe/London',
    });
    setDepartureStationText(originStationName);
    setSelectedArrivalStation({
      id: testDestinationId,
      name: destinationStationName,
      placeTypes: ['railway-station'],
      coordinates: {latitude: 0, longitude: 0}, // Dummy coords
      countryCode: 'FR',
      countryName: 'France',
      iataCode: null,
      timeZone: 'Europe/Paris',
    });
    setArrivalStationText(destinationStationName);
  }, []);

  const transformApiTrainOfferToTrain = (
    offer: ApiTrainOffer,
    depStation: Place | null | undefined,
    arrStation: Place | null | undefined,
    passengerCountVal: number,
  ): Train => {
    const firstTrip = offer.trips?.[0];
    const firstSegment = firstTrip?.segments?.[0];

    return {
      id: offer.id,
      operator: firstSegment?.vehicle?.name || 'Unknown Operator',
      from: depStation?.name || firstSegment?.origin?.name || 'N/A',
      to: arrStation?.name || firstSegment?.destination?.name || 'N/A',
      departureTime: firstSegment
        ? formatApiTime(firstSegment.departureAt)
        : 'N/A',
      arrivalTime: firstSegment ? formatApiTime(firstSegment.arrivalAt) : 'N/A',
      duration: firstSegment
        ? calculateDuration(firstSegment.departureAt, firstSegment.arrivalAt)
        : 'N/A',
      class:
        firstSegment?.fare?.marketingName || firstSegment?.fare?.type || 'N/A',
      price: `${offer.price.amount} ${offer.price.currency}`,
      passengerCount: passengerCountVal,
      expiresAt: offer.expiresAt,
    };
  };

  const fetchTrainStations = async (
    inputText: string,
    type: 'departure' | 'arrival',
  ) => {
    if (inputText.length < 3) {
      if (type === 'departure') {
        setDepartureStationSuggestions([]);
      } else {
        setArrivalStationSuggestions([]);
      }
      return;
    }

    // Call your backend endpoint
    const url = `${API_BASE}/train-station-suggestions?name=${encodeURIComponent(
      inputText,
    )}`;
    console.log(`Fetching train stations from backend: ${url}`);

    try {
      const response = await fetch(url, {method: 'GET'}); // No API key needed here
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Backend API call failed for stations: ${response.status} - ${errText}`,
        );
      }
      const data = await response.json();
      const stations = data?.items || [];
      if (type === 'departure') {
        setDepartureStationSuggestions(stations);
      } else {
        setArrivalStationSuggestions(stations);
      }
    } catch (error) {
      console.error('Error fetching train stations via backend:', error);
      if (type === 'departure') {
        setDepartureStationSuggestions([]);
      } else {
        setArrivalStationSuggestions([]);
      }
      Alert.alert(
        'Station Fetch Error',
        (error as Error).message || 'Could not fetch station suggestions.',
      );
    }
  };

  const handleSearch = async () => {
    if (
      !selectedDepartureStation ||
      !selectedArrivalStation ||
      !departureDate
    ) {
      Alert.alert(
        'Validation Error',
        'Please select departure, arrival stations and a departure date.',
      );
      return;
    }

    setIsLoading(true);
    setResultsData([]);
    console.log(
      `Starting train search for ${selectedDepartureStation.name} to ${selectedArrivalStation.name}`,
    );

    try {
      const formattedDepartureDate = formatDateForApi(departureDate);
      // Example: T12:30:00Z. Adjust time as needed or make it dynamic.
      const departureDateTime = `${formattedDepartureDate}T12:30:00Z`;
      const numPassengers = parseInt(passengerCount, 10) || 1;
      const passengerAgesPayload = Array(numPassengers).fill({
        dateOfBirth: '1995-02-01', // Example passenger DOB
      });

      const searchPayload = {
        originId: selectedDepartureStation.id,
        destinationId: selectedArrivalStation.id,
        departureAfter: departureDateTime,
        returnDepartureAfter: null, // Assuming one-way for now
        passengerAges: passengerAgesPayload,
      };

      console.log('Sending train search payload to backend:', searchPayload);

      // Call your backend's /train-search endpoint
      const response = await fetch(`${API_BASE}/train-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(searchPayload),
      });

      const responseText = await response.text(); // Get text for robust error handling
      console.log(
        `Backend train search response status: ${
          response.status
        }, Text: ${responseText.substring(0, 500)}...`,
      );

      if (!response.ok) {
        let errorDetail = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail =
            errorJson.message ||
            errorJson.error ||
            JSON.stringify(errorJson.details) ||
            JSON.stringify(errorJson);
        } catch (e) {
          /* Not JSON, use raw text */
        }
        throw new Error(
          `Train search failed: ${response.status} – ${errorDetail}`,
        );
      }

      const offersData: ListTrainOffersResponse = JSON.parse(responseText);

      if (offersData && offersData.items && offersData.items.length > 0) {
        console.log(`Received ${offersData.items.length} train offers.`);
        const transformedTrains = offersData.items.map(offer =>
          transformApiTrainOfferToTrain(
            offer,
            selectedDepartureStation,
            selectedArrivalStation,
            numPassengers,
          ),
        );
        console.log(
          `Transformed ${transformedTrains.length} trains. First ID: ${
            transformedTrains.length > 0 ? transformedTrains[0].id : 'N/A'
          }`,
        );
        setResultsData(transformedTrains);
        setShowResults(true);
        console.log('handleSearch: setShowResults(true) was just called.');
      } else {
        console.log('No train offers found from backend or data was empty.');
        setResultsData([]);
        Alert.alert('No Results', 'No train offers found.');
        setShowResults(false);
      }
    } catch (error: any) {
      console.error('Error during train search process:', error);
      Alert.alert(
        'Search Error',
        error.message || 'An unexpected error occurred during train search.',
      );
      setShowResults(false); // Don't show results if search failed
    } finally {
      setIsLoading(false);
      console.log(
        'handleSearch: finally block executed. isLoading should be false.',
      );
    }
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setResultsData([]);
    setDepartureStationText('');
    setArrivalStationText('');
    setSelectedDepartureStation(null);
    setSelectedArrivalStation(null);
    setDepartureStationSuggestions([]);
    setArrivalStationSuggestions([]);
    setDepartureDate(new Date(2025, 5, 24));
    setPassengerCount('1');
    setIsLoading(false); // Ensure isLoading is false here too
    console.log('handleNewSearch called, showResults is false.');
  };

  // ADD THIS LOG: To see showResults right before the conditional render
  console.log(
    `TrainSearchScreen: About to check render conditions. isLoading: ${isLoading}, showResults: ${showResults}`,
  );

  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={screenStyles.loadingText}>Searching for trains...</Text>
      </View>
    );
  }

  if (showResults) {
    // This should render your MINIMAL TrainResultsList for testing
    return (
      <TrainResultsList results={resultsData} onNewSearch={handleNewSearch} />
    );
  }

  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>Search Trains</Text>
      <PlaceInput
        placeholder="Departure station name"
        inputText={departureStationText}
        suggestions={departureStationSuggestions}
        onInputChange={text => {
          setDepartureStationText(text);
          if (text.length === 0) {
            setSelectedDepartureStation(null);
            setDepartureStationSuggestions([]);
          }
        }}
        onFetchSuggestions={text => fetchTrainStations(text, 'departure')}
        onSelectPlace={place => {
          setDepartureStationText(place.name);
          setSelectedDepartureStation(place);
          setDepartureStationSuggestions([]);
        }}
      />

      <PlaceInput
        placeholder="Arrival station name"
        inputText={arrivalStationText}
        suggestions={arrivalStationSuggestions}
        onInputChange={text => {
          setArrivalStationText(text);
          if (text.length === 0) {
            setSelectedArrivalStation(null);
            setArrivalStationSuggestions([]);
          }
        }}
        onFetchSuggestions={text => fetchTrainStations(text, 'arrival')}
        onSelectPlace={place => {
          setArrivalStationText(place.name);
          setSelectedArrivalStation(place);
          setArrivalStationSuggestions([]);
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
        placeholderTextColor={colors.placeholderText}
        // value={...} onChangeText={...} // If you implement return date
      />

      <TextInput
        style={formStyles.input}
        placeholder="Passengers (e.g., 1)"
        keyboardType="number-pad"
        value={passengerCount}
        onChangeText={setPassengerCount}
        placeholderTextColor={colors.placeholderText}
      />

      <TouchableOpacity
        style={buttonStyles.primary}
        onPress={handleSearch}
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Search Trains</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TrainSearchScreen;
