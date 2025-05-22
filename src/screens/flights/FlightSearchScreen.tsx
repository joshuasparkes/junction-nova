import React, {useState} from 'react';
import {Platform} from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types';
import {Flight, ListFlightOffersResponse, ApiPlace} from '../../types';
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

const POLLING_INTERVAL = 5000;
const MAX_POLLING_ATTEMPTS = 12;
const API_BASE = Platform.select({
  ios: 'http://192.168.1.22:4000',
  android: 'http://10.0.2.2:4000',
  default: 'http://192.168.1.22:4000',
});
const FlightSearchScreen = () => {
  const navigation = useNavigation<FlightSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Flight[]>([]);
  const [departureInputText, setDepartureInputText] = useState('');
  const [arrivalInputText, setArrivalInputText] = useState('');
  const [departurePlaceSuggestions, setDeparturePlaceSuggestions] = useState<
    ApiPlace[]
  >([]);
  const [arrivalPlaceSuggestions, setArrivalPlaceSuggestions] = useState<
    ApiPlace[]
  >([]);
  const [selectedDeparturePlace, setSelectedDeparturePlace] =
    useState<ApiPlace | null>(null);
  const [selectedArrivalPlace, setSelectedArrivalPlace] =
    useState<ApiPlace | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    getDefaultDepartureDate(),
  );
  const [passengerCount, setPassengerCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const currentPollAttempt = React.useRef(0);

  React.useEffect(() => {
    let progressIntervalId: NodeJS.Timeout | null = null;
    if (isLoading) {
      setLoadingProgress(0);
      // const totalApproximatePollingTime = POLLING_INTERVAL * MAX_POLLING_ATTEMPTS; // Not used directly for progress calc

      progressIntervalId = setInterval(() => {
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
      }, POLLING_INTERVAL / 5);
    } else {
      if (progressIntervalId) {
        clearInterval(progressIntervalId);
      }
      setLoadingProgress(0);
      currentPollAttempt.current = 0;
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
    if (inputText.length !== 3) {
      if (type === 'departure') {
        setDeparturePlaceSuggestions([]);
        setSelectedDeparturePlace(null);
      } else {
        setArrivalPlaceSuggestions([]);
        setSelectedArrivalPlace(null);
      }
      return;
    }

    try {
      const code = inputText.toUpperCase();
      const resp = await fetch(`${API_BASE}/places?iata=${code}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!resp.ok) {
        throw new Error(`Places lookup failed: ${resp.status}`);
      }
      const body = await resp.json();
      const items: ApiPlace[] = body.items || [];

      if (type === 'departure') {
        setDeparturePlaceSuggestions(items);
      } else {
        setArrivalPlaceSuggestions(items);
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      if (type === 'departure') {
        setDeparturePlaceSuggestions([]);
        setSelectedDeparturePlace(null);
      } else {
        setArrivalPlaceSuggestions([]);
        setSelectedArrivalPlace(null);
      }
    }
  };

  const handleSearch = async () => {
    if (!selectedDeparturePlace || !selectedArrivalPlace || !departureDate) {
      Alert.alert(
        'Validation Error',
        'Please select departure, arrival places and a departure date.',
      );
      return;
    }

    setIsLoading(true);
    setResultsData([]);
    try {
      const formattedDepartureDate = formatDateForApi(departureDate);
      const payload = {
        originId: selectedDeparturePlace.id,
        destinationId: selectedArrivalPlace.id,
        departureAfter: `${formattedDepartureDate}T14:15:22Z`,
        passengerAges: Array(parseInt(passengerCount, 10) || 1).fill({
          dateOfBirth: '2000-01-01',
        }),
      };

      const resp = await fetch(`${API_BASE}/flight-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Search failed: ${resp.status} – ${text}`);
      }

      const offersData: ListFlightOffersResponse = await resp.json();
      const flights = (offersData.items || []).map(
        transformApiFlightOfferToFlight,
      );

      if (flights.length) {
        setResultsData(flights);
        setShowResults(true);
      } else {
        Alert.alert('No Results', 'No flight offers found.');
      }
    } catch (err: any) {
      console.error('Flight search error:', err);
      Alert.alert('Search Error', err.message);
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
      Alert.alert(
        'Error',
        'Cannot proceed with booking: selected flight data is incomplete.',
      );
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
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Passengers (e.g., 1)"
        keyboardType="number-pad"
        value={passengerCount}
        onChangeText={setPassengerCount}
        placeholderTextColor={colors.placeholderText}
      />
      <TouchableOpacity style={buttonStyles.primary} onPress={handleSearch}>
        <Text style={buttonStyles.primaryText}>Search Flights</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    height: 20,
    width: '80%',
    backgroundColor: colors.inputBorder,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
});

export default FlightSearchScreen;
