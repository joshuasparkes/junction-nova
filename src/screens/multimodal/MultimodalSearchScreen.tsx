import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import PlaceInput from '../../components/PlaceInput';
import DatePickerInput from '../../components/DatePickerInput';
import {formatDateForApi} from '../../utils/flightUtils';
import {
  screenStyles,
  buttonStyles,
  formStyles,
  colors,
} from '../../styles/commonStyles';

// API Base URL
const API_BASE = Platform.select({
  ios: 'http://192.168.1.22:4000',
  android: 'http://10.0.2.2:4000',
  default: 'http://192.168.1.22:4000',
});

// Types for multimodal search
interface Segment {
  mode: string;
  from: string;
  to: string;
  depart_utc: string | null;
  arrive_utc: string | null;
  carrier: string;
  local_departure?: string;
  local_arrival?: string;
}

interface Itinerary {
  price: number;
  currency: number | string; // API returns conversion rate, not currency code
  duration_total: number; // in seconds
  segments: Segment[];
  booking_token: string;
}

interface MultimodalSearchResponse {
  itineraries: Itinerary[];
}

const MultimodalSearchScreen = () => {
  // State for search form
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    new Date(),
  );
  const [passengerCount, setPassengerCount] = useState('1');

  // State for API interaction
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Itinerary[]>([]);

  // Function to search for multimodal itineraries
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
      const payload = {
        origin: originText,
        destination: destinationText,
        date_from: formatDateForApi(departureDate),
        date_to: formatDateForApi(departureDate), // Same day for simplicity
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

  // Function to start a new search
  const handleNewSearch = () => {
    setShowResults(false);
    setResults([]);
  };

  // Function to open booking link
  const handleBooking = (bookingToken: string) => {
    Alert.alert(
      'Booking',
      'This would redirect to Kiwi.com for booking with token: ' + bookingToken,
    );
    // In a real app, you would use Linking to open the URL:
    // Linking.openURL(`https://www.kiwi.com/en/booking?token=${bookingToken}`);
  };

  // Helper function to format UTC timestamp to readable time
  const formatTime = (
    timestamp: number | string | null,
    localTime?: string,
  ): string => {
    // If we have a local time string, use that
    if (localTime) {
      const date = new Date(localTime);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    // Fallback to timestamp if available
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

  // Helper function to format duration in minutes to readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <Text style={screenStyles.loadingText}>
          Searching for itineraries...
        </Text>
      </View>
    );
  }

  // Render results
  if (showResults) {
    return (
      <View style={screenStyles.container}>
        <Text style={screenStyles.title}>Multimodal Results</Text>

        <FlatList
          data={results}
          keyExtractor={(item, index) => `itinerary-${index}`}
          renderItem={({item}) => (
            <View style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.priceText}>£{item.price}</Text>
                <Text style={styles.durationText}>
                  {formatDuration(item.duration_total)}
                </Text>
              </View>

              {item.segments.map((segment, idx) => (
                <View key={`segment-${idx}`} style={styles.segment}>
                  <View style={styles.segmentHeader}>
                    <Text style={styles.modeText}>
                      {segment.mode === 'aircraft' ? '✈️' : '🚆'}{' '}
                      {segment.carrier}
                    </Text>
                  </View>
                  <View style={styles.segmentDetails}>
                    <View style={styles.segmentTime}>
                      <Text style={styles.timeText}>
                        {formatTime(
                          segment.depart_utc,
                          segment.local_departure,
                        )}
                      </Text>
                      <Text style={styles.cityText}>{segment.from}</Text>
                    </View>
                    <View style={styles.segmentDivider}>
                      <Text style={styles.dividerLine}>———</Text>
                    </View>
                    <View style={styles.segmentTime}>
                      <Text style={styles.timeText}>
                        {formatTime(segment.arrive_utc, segment.local_arrival)}
                      </Text>
                      <Text style={styles.cityText}>{segment.to}</Text>
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
              style={[styles.secondaryButton, styles.newSearchButton]}
              onPress={handleNewSearch}>
              <Text style={styles.secondaryButtonText}>New Search</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  // Render search form
  return (
    <ScrollView
      contentContainerStyle={screenStyles.contentContainer}
      keyboardShouldPersistTaps="handled"
      style={screenStyles.scrollViewOuter}>
      <View style={styles.screenContainerInput}>
        <Text style={screenStyles.title}>Multimodal Search</Text>
        <Text style={styles.subtitle}>Find flights + trains in one search</Text>

        <TextInput
          style={formStyles.input}
          placeholder="Origin city (e.g., London)"
          placeholderTextColor={colors.placeholderText}
          value={originText}
          onChangeText={setOriginText}
        />

        <TextInput
          style={formStyles.input}
          placeholder="Destination city (e.g., Paris)"
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

const styles = StyleSheet.create({
  screenContainerInput: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    width: '100%',
  },
  placeInputWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateInputTouchable: {
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: colors.inputText,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 20,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Result styles
  resultItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    paddingBottom: 10,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  durationText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  segment: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  segmentHeader: {
    marginBottom: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  segmentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentTime: {
    alignItems: 'center',
    width: '40%',
  },
  segmentDivider: {
    width: '20%',
    alignItems: 'center',
  },
  dividerLine: {
    color: colors.inputBorder,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  cityText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  newSearchButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default MultimodalSearchScreen;
