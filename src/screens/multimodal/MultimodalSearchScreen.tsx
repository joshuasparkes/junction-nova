import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import DatePickerInput from '../../components/DatePickerInput';
import {formatDateForApi} from '../../utils/flightUtils';
import {
  screenStyles,
  buttonStyles,
  formStyles,
  colors,
  resultStyles,
} from '../../styles/commonStyles';
import {
  ApiItinerary,
  MultimodalSearchResponse,
  MultimodalSearchPayload,
} from '../../types';

// API Base URL
const API_BASE = Platform.select({
  ios: 'http://192.168.1.22:4000',
  android: 'http://10.0.2.2:4000',
  default: 'http://192.168.1.22:4000',
});

const MultimodalSearchScreen = () => {
  const getFiveDaysFromNow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date;
  };

  const [originText, setOriginText] = useState('PAR');
  const [destinationText, setDestinationText] = useState('LON');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    getFiveDaysFromNow(),
  );
  const [passengerCount, setPassengerCount] = useState('1');

  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ApiItinerary[]>([]);

  const handleSearch = async () => {
    if (!originText || !destinationText || !departureDate) {
      Alert.alert(
        'Validation Error',
        'Please enter origin, destination, and departure date.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const payload: MultimodalSearchPayload = {
        origin: originText,
        destination: destinationText,
        date_from: formatDateForApi(departureDate),
        date_to: formatDateForApi(departureDate),
        adults: parseInt(passengerCount, 10) || 1,
      };

      console.log('Searching with payload:', payload);

      const response = await fetch(`${API_BASE}/multimodal-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} – ${errorText}`);
      }

      const data: MultimodalSearchResponse = await response.json();

      if (data.itineraries && data.itineraries.length > 0) {
        setResults(data.itineraries);
        setShowResults(true);
      } else {
        Alert.alert('No Results', 'No itineraries found for this route.');
      }
    } catch (error: any) {
      console.error('Multimodal search error:', error);
      Alert.alert('Search Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setResults([]);
  };

  const handleBooking = (bookingToken: string) => {
    Alert.alert(
      'Booking',
      'This would redirect to Kiwi.com for booking with token: ' + bookingToken,
    );
  };

  const formatTime = (
    timestamp: number | string | null,
    localTime?: string,
  ): string => {
    if (localTime) {
      const date = new Date(localTime);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    if (timestamp && typeof timestamp === 'number') {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    return '--:--';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getAirportInfo = (segment: any): string => {
    if (segment.flyFrom && segment.flyTo) {
      return `${segment.flyFrom} → ${segment.flyTo}`;
    }
    return `${segment.from} → ${segment.to}`;
  };

  const getFlightNumber = (segment: any): string => {
    if (segment.flight_no && segment.airline) {
      return `${segment.airline} ${segment.flight_no}`;
    }
    return segment.carrier || '';
  };

  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <Text style={screenStyles.loadingText}>
          Searching for itineraries...
        </Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={screenStyles.container}>
        <Text style={screenStyles.title}>Multimodal Results</Text>

        <FlatList
          data={results}
          keyExtractor={(item, index) => `itinerary-${index}`}
          renderItem={({item}) => (
            <View style={resultStyles.item}>
              <View style={resultStyles.header}>
                <Text style={resultStyles.priceText}>£{item.price}</Text>
                <Text style={resultStyles.durationText}>
                  {formatDuration(item.duration_total)}
                </Text>
              </View>

              <View style={resultStyles.routeOverview}>
                <Text style={resultStyles.routeText}>
                  {item.cityFrom} ({item.cityCodeFrom}) → {item.cityTo} (
                  {item.cityCodeTo})
                </Text>
                {item.countryFrom && item.countryTo && (
                  <Text style={resultStyles.countryText}>
                    {item.countryFrom.name} → {item.countryTo.name}
                  </Text>
                )}
              </View>

              {item.virtual_interlining && (
                <View style={resultStyles.badge}>
                  <Text style={resultStyles.badgeText}>
                    Virtual Interlining
                  </Text>
                </View>
              )}

              {item.airlines && item.airlines.length > 0 && (
                <View style={resultStyles.airlinesContainer}>
                  <Text style={resultStyles.airlinesLabel}>Airlines: </Text>
                  <Text style={resultStyles.airlinesText}>
                    {item.airlines.join(', ')}
                  </Text>
                </View>
              )}

              {item.segments.map((segment, idx) => (
                <View key={`segment-${idx}`} style={resultStyles.segment}>
                  <View style={resultStyles.segmentHeader}>
                    <Text style={resultStyles.modeText}>
                      {segment.mode === 'aircraft' ? '✈️' : '🚆'}{' '}
                      {getFlightNumber(segment)}
                    </Text>
                    <Text style={resultStyles.airportText}>
                      {getAirportInfo(segment)}
                    </Text>
                  </View>
                  <View style={resultStyles.segmentDetails}>
                    <View style={resultStyles.segmentTime}>
                      <Text style={resultStyles.timeText}>
                        {formatTime(
                          segment.depart_utc,
                          segment.local_departure,
                        )}
                      </Text>
                      <Text style={resultStyles.cityText}>{segment.from}</Text>
                      {segment.flyFrom && (
                        <Text style={resultStyles.airportCodeText}>
                          {segment.flyFrom}
                        </Text>
                      )}
                    </View>
                    <View style={resultStyles.segmentDivider}>
                      <Text style={resultStyles.dividerLine}>———</Text>
                    </View>
                    <View style={resultStyles.segmentTime}>
                      <Text style={resultStyles.timeText}>
                        {formatTime(segment.arrive_utc, segment.local_arrival)}
                      </Text>
                      <Text style={resultStyles.cityText}>{segment.to}</Text>
                      {segment.flyTo && (
                        <Text style={resultStyles.airportCodeText}>
                          {segment.flyTo}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={buttonStyles.primary}
                onPress={() => handleBooking(item.booking_token)}>
                <Text style={buttonStyles.primaryText}>Book</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={[
                buttonStyles.secondary,
                {marginTop: 20, marginBottom: 40},
              ]}
              onPress={handleNewSearch}>
              <Text style={buttonStyles.secondaryText}>New Search</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={screenStyles.contentContainer}
      keyboardShouldPersistTaps="handled"
      style={screenStyles.scrollViewOuter}>
      <View style={screenStyles.screenContainerInput}>
        <Text style={screenStyles.title}>Multimodal Search</Text>
        <Text style={screenStyles.subtitle}>
          Find flights + trains in one search
        </Text>

        <TextInput
          style={formStyles.input}
          placeholder="Origin city (e.g., PAR)"
          placeholderTextColor={colors.placeholderText}
          value={originText}
          onChangeText={setOriginText}
        />

        <TextInput
          style={formStyles.input}
          placeholder="Destination city (e.g., LON)"
          placeholderTextColor={colors.placeholderText}
          value={destinationText}
          onChangeText={setDestinationText}
        />

        <DatePickerInput
          placeholder="Departure date"
          value={departureDate}
          onChange={setDepartureDate}
          minimumDate={new Date()}
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
          <Text style={buttonStyles.primaryText}>Search</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default MultimodalSearchScreen;
