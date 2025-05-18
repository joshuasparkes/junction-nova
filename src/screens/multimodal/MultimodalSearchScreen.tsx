import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {CarRentalStackParamList} from '../../navigation/types';
import {mockCarRentalsData, CarRental} from '../../data/mockData';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import {ApiPlace, Itinerary, Leg} from '../../types/multimodal';
import {
  initiateSearch,
  pollOffers,
  fetchPlacesApi,
} from '../../api/multimodalApi';
import {
  mapTrainOfferToLeg,
  mapFlightOfferToLeg,
} from '../../utils/multimodalMappers';
import {buildMultimodalItineraries} from '../../utils/itineraryBuilder';
import PlaceInput from '../../components/PlaceInput';
import {Place} from '../../types';

type CarRentalSearchScreenNavigationProp = StackNavigationProp<
  CarRentalStackParamList,
  'CarRentalSearch'
>;

const PASSENGER_DOB = '1995-01-01';
const FIXED_DEPARTURE_TIME = 'T10:00:00Z';

const MultimodalSearchScreen = () => {
  const navigation = useNavigation<CarRentalSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Itinerary[]>([]);
  const [expandedItineraryId, setExpandedItineraryId] = useState<string | null>(
    null,
  );

  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<ApiPlace[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    ApiPlace[]
  >([]);
  const [selectedOriginPlace, setSelectedOriginPlace] =
    useState<ApiPlace | null>(null);
  const [selectedDestinationPlace, setSelectedDestinationPlace] =
    useState<ApiPlace | null>(null);

  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const fetchPlaceSuggestions = async (
    query: string,
    type: 'origin' | 'destination',
  ) => {
    console.log(
      `[MultimodalSearchScreen] fetchPlaceSuggestions triggered. Query: "${query}", Type: ${type}`,
    );
    if (query.length < 2) {
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
      console.log(
        `[MultimodalSearchScreen] Query too short. Cleared suggestions for ${type}.`,
      );
      return;
    }
    try {
      const places: ApiPlace[] = await fetchPlacesApi(query);
      console.log(
        `[MultimodalSearchScreen] Fetched places for "${query}" (${type}): ${places.length} items.`,
        places,
      );
      if (type === 'origin') {
        setOriginSuggestions(places);
      } else {
        setDestinationSuggestions(places);
      }
    } catch (error) {
      console.error(
        `[MultimodalSearchScreen] Error in fetchPlaceSuggestions for ${type}:`,
        error,
      );
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    }
  };

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedFetchOriginSuggestions = useCallback(
    debounce((query: string) => fetchPlaceSuggestions(query, 'origin'), 300),
    [],
  );
  const debouncedFetchDestinationSuggestions = useCallback(
    debounce(
      (query: string) => fetchPlaceSuggestions(query, 'destination'),
      300,
    ),
    [],
  );

  const handleOriginInputChange = (text: string) => {
    setOriginQuery(text);
    if (text.length === 0) {
      setOriginSuggestions([]);
      setSelectedOriginPlace(null);
    }
  };

  const handleDestinationInputChange = (text: string) => {
    setDestinationQuery(text);
    if (text.length === 0) {
      setDestinationSuggestions([]);
      setSelectedDestinationPlace(null);
    }
  };

  const handleSelectOriginPlace = (place: ApiPlace) => {
    console.log('[MultimodalSearchScreen] Selected Origin Place:', place);
    setSelectedOriginPlace(place);
    setOriginQuery(place.name);
    setOriginSuggestions([]);
  };

  const handleSelectDestinationPlace = (place: ApiPlace) => {
    console.log('[MultimodalSearchScreen] Selected Destination Place:', place);
    setSelectedDestinationPlace(place);
    setDestinationQuery(place.name);
    setDestinationSuggestions([]);
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    setDepartureDate(date);
    hideDatePicker();
  };

  const formatDateForDisplay = (date: Date | null): string => {
    return date ? date.toLocaleDateString() : 'Select date';
  };

  const formatDateForApi = (date: Date | null): string | null => {
    if (!date) {
      return null;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSearch = async () => {
    if (!selectedOriginPlace || !selectedDestinationPlace) {
      Alert.alert(
        'Missing Information',
        'Please select origin and destination from the suggestions.',
      );
      return;
    }
    if (!departureDate) {
      Alert.alert('Missing Information', 'Please select a departure date.');
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setResultsData([]);

    try {
      const departureDateString = formatDateForApi(departureDate);
      if (!departureDateString) {
        Alert.alert('Error', 'Invalid departure date.');
        setIsLoading(false);
        return;
      }
      const departureDateTime = `${departureDateString}${FIXED_DEPARTURE_TIME}`;

      const searchPromises = [];

      if (selectedOriginPlace.id && selectedDestinationPlace.id) {
        searchPromises.push(
          initiateSearch(
            'train',
            selectedOriginPlace.id,
            selectedDestinationPlace.id,
            departureDateTime,
            PASSENGER_DOB,
          )
            .then(res => pollOffers(res.type, res.searchId))
            .catch(err => {
              console.warn(
                `Train search failed to initiate or poll: ${err.message}`,
              );
              return [];
            }),
        );
        searchPromises.push(
          initiateSearch(
            'flight',
            selectedOriginPlace.id,
            selectedDestinationPlace.id,
            departureDateTime,
            PASSENGER_DOB,
          )
            .then(res => pollOffers(res.type, res.searchId))
            .catch(err => {
              console.warn(
                `Flight search failed to initiate or poll: ${err.message}`,
              );
              return [];
            }),
        );
      } else {
        Alert.alert(
          'Error',
          'Selected origin or destination is missing an ID. Please select from suggestions.',
        );
        setIsLoading(false);
        return;
      }

      const settledResults = await Promise.allSettled(searchPromises);

      const rawTrainOffers =
        settledResults[0]?.status === 'fulfilled'
          ? settledResults[0].value
          : [];
      const rawFlightOffers =
        settledResults[1]?.status === 'fulfilled'
          ? settledResults[1].value
          : [];

      console.log(
        '[MultimodalSearchScreen] Raw Train Offers received:',
        rawTrainOffers.length > 0 ? rawTrainOffers : 'None',
      );
      console.log(
        '[MultimodalSearchScreen] Raw Flight Offers received:',
        rawFlightOffers.length > 0 ? rawFlightOffers : 'None',
      );
      console.log(
        '[MultimodalSearchScreen] Selected Origin for mapping:',
        selectedOriginPlace,
      );
      console.log(
        '[MultimodalSearchScreen] Selected Destination for mapping:',
        selectedDestinationPlace,
      );

      const trainLegs: Leg[] = rawTrainOffers
        .map(offer =>
          mapTrainOfferToLeg(
            offer,
            selectedOriginPlace,
            selectedDestinationPlace,
          ),
        )
        .filter((leg): leg is Leg => leg !== null);
      const flightLegs: Leg[] = rawFlightOffers
        .map(offer => mapFlightOfferToLeg(offer))
        .filter((leg): leg is Leg => leg !== null);

      console.log(
        `[MultimodalSearchScreen] Mapped Train Legs: ${trainLegs.length}`,
        trainLegs,
      );
      console.log(
        `[MultimodalSearchScreen] Mapped Flight Legs: ${flightLegs.length}`,
        flightLegs,
      );

      if (
        trainLegs.length === 0 &&
        flightLegs.length === 0 &&
        (rawTrainOffers.length > 0 || rawFlightOffers.length > 0)
      ) {
        Alert.alert(
          'Mapping Issue',
          'Offers were found but could not be mapped to displayable legs. Check console for details.',
        );
      }

      const itineraries = buildMultimodalItineraries(trainLegs, flightLegs);
      console.log(
        `[MultimodalSearchScreen] Built Itineraries: ${itineraries.length}`,
        itineraries,
      );
      setResultsData(itineraries);
      setShowResults(true);
    } catch (error: any) {
      console.error('Multimodal search error:', error);
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
    setSelectedOriginPlace(null);
    setSelectedDestinationPlace(null);
    setOriginQuery('');
    setDestinationQuery('');
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setDepartureDate(new Date());
    setExpandedItineraryId(null);
  };

  const renderLegDetails = (leg: Leg) => (
    <View key={leg.id} style={styles.legDetailContainer}>
      <Text style={styles.legMode}>
        {leg.mode.toUpperCase()}: {leg.operator}
      </Text>
      <Text>
        From: {leg.from.name} ({leg.from.city})
      </Text>
      <Text>
        To: {leg.to.name} ({leg.to.city})
      </Text>
      <Text>Depart: {new Date(leg.depart).toLocaleString()}</Text>
      <Text>Arrive: {new Date(leg.arrive).toLocaleString()}</Text>
      <Text>Price: {(leg.price / 100).toFixed(2)}</Text>
    </View>
  );

  const renderResultItem = ({item}: {item: Itinerary}) => (
    <TouchableOpacity
      style={styles.resultItemCard}
      onPress={() =>
        setExpandedItineraryId(expandedItineraryId === item.id ? null : item.id)
      }>
      <Text style={styles.resultItemTitle}>
        Itinerary ({item.legs.length} leg{item.legs.length > 1 ? 's' : ''})
      </Text>
      <Text>
        Total Duration: {Math.floor(item.totalDuration / 60)}h{' '}
        {item.totalDuration % 60}m
      </Text>
      <Text>Total Price: {(item.totalPrice / 100).toFixed(2)}</Text>
      <Text>Transfers: {item.transfers}</Text>
      {expandedItineraryId === item.id && (
        <View style={styles.legsContainer}>
          {item.legs.map(renderLegDetails)}
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.screenContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Searching for your journey...</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenTitle}>Search Results</Text>
        {resultsData.length > 0 ? (
          <FlatList
            data={resultsData}
            renderItem={renderResultItem}
            keyExtractor={item => item.id}
            style={styles.resultsList}
          />
        ) : (
          <Text style={styles.placeholderText}>
            No multimodal itineraries found. Try different locations or dates.
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
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={true}>
      <View style={styles.screenContainerInput}>
        <Text style={styles.screenTitle}>Multimodal Search</Text>

        <View
          style={[
            styles.placeInputWrapper,
            {zIndex: originSuggestions.length > 0 ? 10 : 1},
          ]}>
          <PlaceInput
            placeholder="Origin"
            inputText={originQuery}
            suggestions={originSuggestions as Place[]}
            onInputChange={handleOriginInputChange}
            onFetchSuggestions={text => {
              debouncedFetchOriginSuggestions(text);
              if (destinationSuggestions.length > 0) {
                setDestinationSuggestions([]);
              }
            }}
            onSelectPlace={handleSelectOriginPlace as (place: Place) => void}
          />
        </View>

        <View
          style={[
            styles.placeInputWrapper,
            {
              zIndex:
                destinationSuggestions.length > 0
                  ? 10
                  : originSuggestions.length > 0
                  ? 0
                  : 1,
            },
          ]}>
          <PlaceInput
            placeholder="Destination"
            inputText={destinationQuery}
            suggestions={destinationSuggestions as Place[]}
            onInputChange={handleDestinationInputChange}
            onFetchSuggestions={text => {
              debouncedFetchDestinationSuggestions(text);
              if (originSuggestions.length > 0) {
                setOriginSuggestions([]);
              }
            }}
            onSelectPlace={
              handleSelectDestinationPlace as (place: Place) => void
            }
          />
        </View>

        <TouchableOpacity
          style={styles.dateInputTouchable}
          onPress={showDatePicker}>
          <Text style={styles.datePickerText}>
            {formatDateForDisplay(departureDate)}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          minimumDate={new Date()}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
          <Text style={styles.primaryButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#022E79',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  screenContainerInput: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#022E79',
    width: '100%',
  },
  placeInputWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  dateInputTouchable: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    zIndex: 0,
  },
  datePickerText: {
    fontSize: 16,
    color: '#000000',
  },
  primaryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
    zIndex: 0,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resultItemTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  legsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  legDetailContainer: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#FFA500',
  },
  legMode: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 3,
  },
  centerContent: {
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#022E79',
    padding: 20,
  },
});

export default MultimodalSearchScreen;
