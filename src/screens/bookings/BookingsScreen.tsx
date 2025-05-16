import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import { screenStyles, cardStyles, colors } from '../../styles/commonStyles'; // Adjust path as needed

// Placeholder for what a booking item might look like
interface BookingItem {
  id: string;
  type: 'Flight' | 'Hotel' | 'Train' | 'Car'; // Example type
  details: string;
  date: string;
  status: string;
}

const DUMMY_BOOKINGS: BookingItem[] = [
  {id: '1', type: 'Flight', details: 'CDG to JFK, Air France AF002', date: '2025-08-24', status: 'Confirmed'},
  {id: '2', type: 'Hotel', details: 'Grand Hyatt New York, 3 Nights', date: '2025-08-24', status: 'Confirmed'},
  {id: '3', type: 'Flight', details: 'LHR to SFO, British Airways BA285', date: '2025-09-10', status: 'Pending'},
];

const BookingsScreen = () => {
  const renderBookingItem = ({item}: {item: BookingItem}) => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.title}>{item.type} Booking: {item.details}</Text>
      <Text style={cardStyles.text}>Date: {item.date}</Text>
      <Text style={[cardStyles.text, item.status === 'Confirmed' ? styles.confirmedStatus : styles.pendingStatus]}>
        Status: {item.status}
      </Text>
    </View>
  );

  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>My Bookings</Text>
      {DUMMY_BOOKINGS.length > 0 ? (
        <FlatList
          data={DUMMY_BOOKINGS}
          renderItem={renderBookingItem}
          keyExtractor={item => item.id}
          style={styles.list}
        />
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
  emptyText: {
    fontSize: 16,
    color: colors.white,
    marginTop: 20,
  },
  confirmedStatus: {
    color: 'green', // Or use a color from your theme
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: colors.primary, // Or use a color from your theme
    fontWeight: 'bold',
  }
});

export default BookingsScreen;