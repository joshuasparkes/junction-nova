import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

interface DatePickerInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
}

const formatDate = (date: Date | undefined): string => {
  if (!date) {
    return '';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open for iOS inline modes if needed
    if (event.type === 'dismissed') {
      // setShowPicker(false); // Optional: explicitly hide on dismiss if needed
      return;
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
    // Hide automatically after selection/action on platforms where it doesn't self-dismiss
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.inputTouchable}
        onPress={() => setShowPicker(true)}>
        <Text
          style={[
            styles.datePickerText,
            !value && styles.datePickerPlaceholderText,
          ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value || new Date()}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate || new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginBottom: 5,
  },
  inputTouchable: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    minHeight: 48,
  },
  datePickerText: {
    fontSize: 16,
    color: '#000000',
  },
  datePickerPlaceholderText: {
    fontSize: 16,
    color: '#999999',
  },
});

export default DatePickerInput;
