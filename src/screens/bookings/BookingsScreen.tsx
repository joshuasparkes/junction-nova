import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  screenStyles,
  cardStyles,
  colors,
  buttonStyles,
} from '../../styles/commonStyles';

const API_BASE = Platform.select({
  ios: 'http://192.168.1.22:3000', // iOS simulator
  android: 'http://10.0.2.2:3000', // Android emulator
  default: 'http://192.168.1.22:3000', // physical device on your LAN
});

interface BookingItem {
  id: number;
  type_id: string;
  cancellation_id: string | null;
}

const BookingsScreen = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const url = `${API_BASE}/db-data`;
      console.log(`Attempting to fetch from: ${url}`);

      try {
        const resp = await fetch(url, {
          method: 'GET',
          headers: {Accept: 'application/json'},
        });
        console.log(`Response status: ${resp.status}`);

        if (!resp.ok) {
          throw new Error(`Server error ${resp.status}`);
        }
        const data: BookingItem[] = await resp.json();
        console.log('Received data:', data);
        setBookings(data);
      } catch (err: any) {
        console.error('Error loading bookings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const renderBookingItem = ({item}: {item: BookingItem}) => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.title}>Booking #{item.id}</Text>
      <Text style={cardStyles.text}>ID: {item.type_id}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[screenStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[screenStyles.container, styles.center]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={buttonStyles.primary}
          onPress={() => {
            setLoading(true);
            setError(null);
            setBookings([]);
            fetch(`${API_BASE}/db-data`)
              .then(r => r.json())
              .then(data => setBookings(data))
              .catch(e => setError(e.message))
              .finally(() => setLoading(false));
          }}>
          <Text style={buttonStyles.primaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={screenStyles.container}>
      <View style={screenStyles.titleContainer}>
        <Text style={screenStyles.title}>My trips</Text>
      </View>
      {bookings.length > 0 ? (
        <View style={screenStyles.listContainer}>
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item.id.toString()}
            style={styles.list}
            contentContainerStyle={screenStyles.flatListContent}
          />
        </View>
      ) : (
        <Text style={styles.emptyText}>You have no bookings yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.white,
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 10,
  },
  confirmedStatus: {
    color: 'green',
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default BookingsScreen;
