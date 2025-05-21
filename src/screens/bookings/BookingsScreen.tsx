import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  screenStyles,
  cardStyles,
  colors,
  buttonStyles,
} from '../../styles/commonStyles';

const API_BASE = Platform.select({
  ios: 'http://192.168.1.22:4000', // iOS simulator
  android: 'http://10.0.2.2:4000', // Android emulator
  default: 'http://192.168.1.22:4000', // physical device on your LAN
});

interface BookingItem {
  id: number;
  type_id: string;
  cancellation_id: string | null;
  status: 'CONFIRMED' | 'CANCELLATION_PENDING' | 'CANCELLED';
}

const BookingsScreen = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    const url = `${API_BASE}/db-data`;
    console.log(`Attempting to fetch from: ${url}`);

    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {Accept: 'application/json'},
      });
      console.log(`Response status: ${resp.status}`);

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Server error ${resp.status}: ${errorText}`);
      }
      const data: Omit<BookingItem, 'status'>[] = await resp.json();
      console.log('Received data:', data);
      const bookingsWithStatus: BookingItem[] = data.map(b => ({
        ...b,
        status: b.cancellation_id ? 'CANCELLATION_PENDING' : 'CONFIRMED',
      }));
      setBookings(bookingsWithStatus);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateBookingStatus = (
    bookingId: number,
    newStatus: BookingItem['status'],
  ) => {
    setBookings(prevBookings =>
      prevBookings.map(b =>
        b.id === bookingId ? {...b, status: newStatus} : b,
      ),
    );
  };

  const handleRequestCancellation = async (
    numericalId: number,
    typeIdForBody: string,
  ) => {
    console.log(
      `Requesting cancellation for item with numerical ID: ${numericalId}, type_id: ${typeIdForBody}`,
    );
    const requestBody = {bookingId: typeIdForBody};
    console.log('Request body for cancellation:', requestBody);

    try {
      const response = await fetch(`${API_BASE}/cancellations/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({details: `Server error ${response.status}`}));
        throw new Error(
          errorData.details ||
            `Failed to request cancellation: ${response.status}`,
        );
      }

      updateBookingStatus(numericalId, 'CANCELLATION_PENDING');
      Alert.alert(
        'Confirm Cancellation',
        'Your cancellation request has been submitted. Would you like to confirm and finalize the cancellation now?',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () =>
              console.log('User chose to confirm cancellation later.'),
          },
          {
            text: 'Confirm Now',
            onPress: () => handleConfirmCancellation(numericalId),
          },
        ],
      );
    } catch (e: any) {
      setError(e.message);
      console.error('Error requesting cancellation:', e);
    }
  };

  const handleConfirmCancellation = async (numericalId: number) => {
    console.log(
      `Confirming cancellation for booking with numerical ID: ${numericalId}`,
    );
    const requestBody = {};
    console.log('Request body for confirm cancellation:', requestBody);

    try {
      const response = await fetch(
        `${API_BASE}/bookings/${numericalId}/confirm-cancellation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({details: `Server error ${response.status}`}));
        throw new Error(
          errorData.details ||
            `Failed to confirm cancellation: ${response.status}`,
        );
      }
      updateBookingStatus(numericalId, 'CANCELLED');
      Alert.alert(
        'Cancellation Confirmed',
        'Your booking has been successfully cancelled.',
      );
    } catch (e: any) {
      setError(e.message);
      console.error('Error confirming cancellation:', e);
      Alert.alert('Error', `Failed to confirm cancellation: ${e.message}`);
    }
  };

  const renderBookingItem = ({item}: {item: BookingItem}) => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.title}>Booking #{item.id}</Text>
      <Text style={cardStyles.text}>ID: {item.type_id}</Text>
      <Text style={cardStyles.text}>
        Status:{' '}
        <Text
          style={
            item.status === 'CONFIRMED'
              ? styles.confirmedStatus
              : item.status === 'CANCELLATION_PENDING'
              ? styles.pendingStatus
              : item.status === 'CANCELLED'
              ? styles.cancelledStatus
              : {}
          }>
          {item.status.replace('_', ' ')}
        </Text>
      </Text>
      {item.status === 'CONFIRMED' && (
        <TouchableOpacity
          style={[buttonStyles.primary, styles.buttonSpacing]}
          onPress={() => handleRequestCancellation(item.id, item.type_id)}>
          <Text style={buttonStyles.primaryText}>Request Cancellation</Text>
        </TouchableOpacity>
      )}
      {item.status === 'CANCELLATION_PENDING' && (
        <TouchableOpacity
          style={[buttonStyles.warning, styles.buttonSpacing]}
          onPress={() => handleConfirmCancellation(item.id)}>
          <Text style={buttonStyles.warningText}>Confirm Cancellation</Text>
        </TouchableOpacity>
      )}
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
        <TouchableOpacity style={buttonStyles.primary} onPress={fetchBookings}>
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
  cancelledStatus: {
    color: 'grey',
    fontWeight: 'bold',
  },
  buttonSpacing: {
    marginTop: 10,
  },
});

export default BookingsScreen;
