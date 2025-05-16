import {StyleSheet, Platform} from 'react-native';

export const colors = {
  primary: '#FFA500',
  primaryText: '#022E79',
  background: '#022E79',
  white: '#FFFFFF',
  inputBackground: '#FFFFFF',
  inputText: '#000000',
  inputBorder: '#DDDDDD',
  placeholderText: '#999999',
  screenTitle: '#FFFFFF',
  loadingText: '#FFFFFF',
  textDark: '#333333',
  textMedium: '#444444',
  cardBackground: '#FFFFFF',
  shadowColor: '#000000',
};

export const formStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    color: colors.white,
    marginBottom: 5,
    width: '90%',
    textAlign: 'left',
  },
  input: {
    width: '90%',
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export const screenStyles = StyleSheet.create({
  scrollViewOuter: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.screenTitle,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: colors.loadingText,
    textAlign: 'center',
  },
});

export const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '95%',
    shadowColor: colors.shadowColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: colors.textMedium,
    marginBottom: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: 8,
    textAlign: 'right',
  },
});

// You can also create utility style objects if needed for dynamic styling
// or for styles not suitable for StyleSheet.create, though StyleSheet is preferred for performance.
