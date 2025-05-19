import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
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
import TrainResultsList from '../../components/TrainResultsList';
import {
  screenStyles,
  formStyles,
  buttonStyles,
  colors,
} from '../../styles/commonStyles';

type TrainSearchScreenNavigationProp = StackNavigationProp<
  TrainStackParamList,
  'TrainSearch'
>;

const POLLING_INTERVAL = 3000;
const MAX_POLLING_ATTEMPTS = 10;

const TrainSearchScreen = () => {
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Train[]>([]);
  const [departureStationText, setDepartureStationText] = useState('');
  const [arrivalStationText, setArrivalStationText] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    new Date(2025, 5, 24),
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

  useEffect(() => {
    const testOriginId = 'place_01j804c5h1ew3ask9eh2znw3pz';
    const testDestinationId = 'place_01j804922hfcws9mffxbj8tsv3';
    const originStationName = 'London St Pancras Intl';
    const destinationStationName = 'Paris Gare du Nord';
    setSelectedDepartureStation({
      id: testOriginId,
      name: originStationName,
      placeTypes: ['railway-station'],
      coordinates: {latitude: 0, longitude: 0},
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
      coordinates: {latitude: 0, longitude: 0},
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

    const url = `https://content-api.sandbox.junction.dev/places?filter[name][like]=${encodeURIComponent(
      inputText,
    )}&filter[type][eq]=railway-station&page[limit]=5`;

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

    try {
      const formattedDepartureDate = formatDateForApi(departureDate);
      const createSearchUrl =
        'https://content-api.sandbox.junction.dev/train-searches';
      const departureDateTime = `${formattedDepartureDate}T12:30:00Z`;
      const numPassengers = parseInt(passengerCount, 10) || 1;
      const passengerAgesPayload = Array(numPassengers).fill({
        dateOfBirth: '1995-02-01',
      });

      const createSearchBody = {
        originId: selectedDepartureStation.id,
        destinationId: selectedArrivalStation.id,
        departureAfter: departureDateTime,
        returnDepartureAfter: null,
        passengerAges: passengerAgesPayload,
      };

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
        /train-searches\/(train_search_[a-zA-Z0-9]+)/,
      );
      const trainSearchId = trainSearchIdMatch?.[1];

      if (!trainSearchId) {
        throw new Error(
          `Could not parse trainSearchId from Location header: ${locationHeader}`,
        );
      }

      let attempts = 0;
      let offersData: ListTrainOffersResponse | null = null;
      let offersFound = false;

      while (attempts < MAX_POLLING_ATTEMPTS && !offersFound) {
        attempts++;
        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        }

        const getOffersUrl = `https://content-api.sandbox.junction.dev/train-searches/${trainSearchId}/offers`;
        const getOffersResponse = await fetch(getOffersUrl, {
          method: 'GET',
          headers: {'x-api-key': apiKey, Accept: 'application/json'},
        });

        if (getOffersResponse.status === 200) {
          const responseText = await getOffersResponse.text();
          if (responseText) {
            const parsedData: ListTrainOffersResponse =
              JSON.parse(responseText);
            if (parsedData?.items?.length > 0) {
              offersData = parsedData;
              offersFound = true;
              break;
            }
          }
        } else if (getOffersResponse.status !== 202) {
          const errorText = await getOffersResponse.text();
          console.error(
            `Attempt ${attempts} - Error fetching offers: ${getOffersResponse.status}, ${errorText}`,
          );
          if (attempts === MAX_POLLING_ATTEMPTS) {
            throw new Error(
              `Failed to fetch train offers. Status: ${getOffersResponse.status}`,
            );
          }
        }
      }

      if (offersFound && offersData) {
        const transformedTrains = offersData.items.map(offer =>
          transformApiTrainOfferToTrain(
            offer,
            selectedDepartureStation,
            selectedArrivalStation,
            numPassengers,
          ),
        );
        setResultsData(transformedTrains);
      } else {
        setResultsData([]);
        Alert.alert(
          'No Results',
          'No train offers found after polling, or an error occurred.',
        );
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
    setDepartureDate(new Date(2025, 5, 24));
    setPassengerCount('1');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <Text style={screenStyles.loadingText}>Searching for trains...</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={screenStyles.container}>
        <TrainResultsList results={resultsData} onNewSearch={handleNewSearch} />
      </View>
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
        <Text style={buttonStyles.primaryText}>Search Trains</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TrainSearchScreen;
