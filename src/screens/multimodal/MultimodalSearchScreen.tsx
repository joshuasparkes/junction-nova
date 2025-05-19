import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import PlaceInput from '../../components/PlaceInput';
import {
  screenStyles,
  buttonStyles,
  formStyles,
  colors,
} from '../../styles/commonStyles';

const MultimodalSearchScreen = () => {
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    setDepartureDate(date);
    hideDatePicker();
  };

  const formatDateForDisplay = (date: Date | null): string => {
    return date ? date.toLocaleDateString() : 'Select date';
  };

  return (
    <ScrollView
      contentContainerStyle={screenStyles.contentContainer}
      keyboardShouldPersistTaps="handled"
      style={screenStyles.scrollViewOuter}>
      <View style={styles.screenContainerInput}>
        <Text style={screenStyles.title}>Multimodal Search</Text>

        <View style={styles.placeInputWrapper}>
          {/* <PlaceInput placeholder="Origin" /> */}
        </View>

        <View style={styles.placeInputWrapper}>
          {/* <PlaceInput placeholder="Destination" /> */}
        </View>

        <TouchableOpacity
          style={[formStyles.input, styles.dateInputTouchable]}
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

        <TouchableOpacity style={buttonStyles.primary}>
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
});

export default MultimodalSearchScreen;
