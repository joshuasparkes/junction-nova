import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
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

type FlightSearchScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightSearch'
>;

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
    undefined,
  );
  const [passengerCount, setPassengerCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const [apiKey] = useState<string>('jk_live_01j8r3grxbeve8ta0h1t5qbrvx');

  const fetchPlaces = async (
    inputText: string,
    type: 'departure' | 'arrival',
  ) => {
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

  const handleSearch = async () => {
    const formattedDepartureDate = formatDateForApi(departureDate);
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
      const flightSearchIdMatch = locationHeader.match(
        /flight-searches\/(flight_search_[a-zA-Z0-9]+)\/offers/,
      );
      const flightSearchId = flightSearchIdMatch?.[1];
      console.log('Extracted flightSearchId:', flightSearchId);

      await new Promise(resolve => setTimeout(resolve, 10000));

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
      let offersData: ListFlightOffersResponse | null = null;
      if (responseText) {
        try {
          offersData = JSON.parse(responseText);
        } catch (parseError) {
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
    setPassengerCount('1');
    setIsLoading(false);
  };

  if (showResults) {
    return (
      <View style={styles.screenContainer}>
        <FlightResultsList
          results={resultsData}
          onNewSearch={handleNewSearch}
        />
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
  loadingContainer: {
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default FlightSearchScreen;
