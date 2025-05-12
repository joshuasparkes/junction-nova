import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {TrainStackParamList} from '../../navigation/types';
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
} from '../../utils/flightUtils';
import PlaceInput from '../../components/PlaceInput';
import DatePickerInput from '../../components/DatePickerInput';

type TrainSearchScreenNavigationProp = StackNavigationProp<
  TrainStackParamList,
  'TrainSearch'
>;

const POLLING_INTERVAL = 3000;
const MAX_POLLING_ATTEMPTS = 10;

const TrainSearchScreen = () => {
  const navigation = useNavigation<TrainSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Train[]>([]);
  const [departureStationText, setDepartureStationText] = useState('');
  const [arrivalStationText, setArrivalStationText] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined,
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
  const [apiKey] = useState<string>('jk_live_01j8r3grxbeve8ta0h1t5qbrvx');

  const transformApiTrainOfferToTrain = (
    offer: ApiTrainOffer,
    depStation?: Place | null,
    arrStation?: Place | null,
  ): Train => {
    const firstTrip = offer.trips?.[0];
    const firstSegment = firstTrip?.segments?.[0];

    return {
      id: offer.id,
      operator: firstSegment?.vehicle?.name || 'Unknown Operator',
      from: depStation?.name || firstSegment?.origin || 'N/A',
      to: arrStation?.name || firstSegment?.destination || 'N/A',
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

    const url = `https://content-api.sandbox.junction.dev/places?filter[name][like]=${encodeURIComponent(
      inputText,
    )}&filter[type][eq]=railway-station&page[limit]=5`;

    console.log(`Fetching railway stations for: ${inputText}`);

    const headers = {
      'x-api-key': apiKey,
      Accept: 'application/json',
    };

    try {
      const response = await fetch(url, {method: 'GET', headers: headers});
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      const data = await response.json();
      const stations = data?.items || [];
      if (type === 'departure') {
        setDepartureStationSuggestions(stations);
      } else {
        setArrivalStationSuggestions(stations);
      }
    } catch (error) {
      console.error('Error fetching train stations:', error);
      if (type === 'departure') {
        setDepartureStationSuggestions([]);
      } else {
        setArrivalStationSuggestions([]);
      }
    }
  };

  const handleSearch = async () => {
    if (!selectedDepartureStation || !selectedArrivalStation) {
      Alert.alert(
        'Error',
        'Please select both departure and arrival stations.',
      );
      return;
    }
    const formattedDepartureDate = formatDateForApi(departureDate);
    if (!formattedDepartureDate) {
      Alert.alert('Error', 'Please select a departure date.');
      return;
    }

    setIsLoading(true);
    setResultsData([]);

    try {
      const createSearchUrl =
        'https://content-api.sandbox.junction.dev/train-searches';
      const departureDateTime = `${formattedDepartureDate}T00:00:00Z`;
      const numPassengers = parseInt(passengerCount, 10) || 1;
      const passengerAgesPayload = Array(numPassengers).fill({
        dateOfBirth: '2000-01-01',
      });

      const createSearchBody = {
        originId: selectedDepartureStation.id,
        destinationId: selectedArrivalStation.id,
        departureAfter: departureDateTime,
        returnDepartureAfter: null,
        passengerAges: passengerAgesPayload,
      };

      console.log(
        'Creating train search with body:',
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
          `Failed to create train search: ${createSearchResponse.status} ${errorText}`,
        );
      }

      const locationHeader = createSearchResponse.headers.get('Location');
      const trainSearchIdMatch = locationHeader?.match(
        /train-searches\/(train_search_[a-zA-Z0-9]+)\/offers/,
      );
      const trainSearchId = trainSearchIdMatch?.[1];

      if (!trainSearchId) {
        throw new Error('Could not parse trainSearchId from Location header');
      }
      console.log('Extracted trainSearchId:', trainSearchId);

      let attempts = 0;
      let offersData: ListTrainOffersResponse | null = null;
      let offersFound = false;

      while (attempts < MAX_POLLING_ATTEMPTS && !offersFound) {
        attempts++;
        console.log(`Polling for train offers, attempt ${attempts}...`);

        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        }

        const getOffersUrl = `https://content-api.sandbox.junction.dev/train-searches/${trainSearchId}/offers`;
        const getOffersResponse = await fetch(getOffersUrl, {
          method: 'GET',
          headers: {'x-api-key': apiKey, Accept: 'application/json'},
        });

        const responseText = await getOffersResponse.text();
        console.log(
          `Attempt ${attempts} - Raw train offers response:`,
          responseText,
        );

        if (!getOffersResponse.ok) {
          console.error(
            `Attempt ${attempts} - Failed to get train offers: ${getOffersResponse.status}`,
          );
          if (attempts === MAX_POLLING_ATTEMPTS) {
            Alert.alert(
              'Error',
              `Failed to fetch train offers after ${attempts} attempts. Status: ${getOffersResponse.status}`,
            );
          }
          continue;
        }

        if (responseText) {
          try {
            const parsedData: ListTrainOffersResponse =
              JSON.parse(responseText);
            if (parsedData?.items?.length > 0) {
              offersData = parsedData;
              offersFound = true;
              console.log(`Attempt ${attempts} - Train offers found!`);
            } else {
              console.log(
                `Attempt ${attempts} - Offers response OK but no items found.`,
              );
            }
          } catch (parseError) {
            console.error(
              `Attempt ${attempts} - Failed to parse train offers JSON:`,
              parseError,
            );
            if (attempts === MAX_POLLING_ATTEMPTS) {
              Alert.alert('Error', 'Failed to parse train offers response.');
            }
          }
        } else {
          console.log(`Attempt ${attempts} - Empty response body.`);
        }
      }

      if (offersFound && offersData) {
        const transformedTrains = offersData.items.map(offer =>
          transformApiTrainOfferToTrain(
            offer,
            selectedDepartureStation,
            selectedArrivalStation,
          ),
        );
        setResultsData(transformedTrains);
      } else {
        setResultsData([]);
        console.log('No train offers found after polling.');
        if (!offersFound && attempts === MAX_POLLING_ATTEMPTS) {
          Alert.alert('Timeout', 'Could not retrieve train offers in time.');
        }
      }
      setShowResults(true);
    } catch (error: any) {
      console.error('Error during train search process:', error);
      Alert.alert(
        'Search Error',
        error.message || 'An unexpected error occurred.',
      );
    } finally {
      setIsLoading(false);
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
    setDepartureDate(undefined);
    setPassengerCount('1');
    setIsLoading(false);
  };

  const renderResultItem = ({item}: {item: Train}) => {
    return (
      <View style={styles.resultItemCard}>
        <Text style={styles.resultItemTitle}>
          {item.operator}: {item.from} to {item.to}
        </Text>
        <Text style={styles.resultItemDetail}>
          Departure: {item.departureTime} - Arrival: {item.arrivalTime}
        </Text>
        <Text style={styles.resultItemDetail}>
          Duration: {item.duration} - Class: {item.class}
        </Text>
        <Text style={styles.resultItemPrice}>{item.price}</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('TrainBooking', {train: item})}>
          <Text style={styles.bookButtonText}>Book Train</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.screenContainer, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Searching for trains...</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenTitle}>Train Results</Text>
        {resultsData.length > 0 ? (
          <FlatList
            data={resultsData}
            renderItem={renderResultItem}
            keyExtractor={item => item.id}
            style={styles.resultsList}
          />
        ) : (
          <Text style={styles.placeholderText}>
            No results found for Trains.
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

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Search Trains</Text>
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

      <TextInput style={styles.input} placeholder="Return date (optional)" />

      <TextInput
        style={styles.input}
        placeholder="Passengers (e.g., 1)"
        keyboardType="number-pad"
        value={passengerCount}
        onChangeText={setPassengerCount}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
        <Text style={styles.primaryButtonText}>Search Trains</Text>
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
});

export default TrainSearchScreen;
