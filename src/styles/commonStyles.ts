import {StyleSheet, Platform} from 'react-native';

export const colors = {
  primary: '#080D4D',
  primaryText: '#FFFFFF',
  background: '#f5f5f7',
  white: '#FFFFFF',
  inputBackground: '#FFFFFF',
  inputText: '#000000',
  inputBorder: '#DDDDDD',
  placeholderText: '#999999',
  screenTitle: '#080D4D',
  loadingText: '#080D4D',
  textDark: '#080D4D',
  textMedium: '#444444',
  cardBackground: '#FFFFFF',
  shadowColor: '#000000',
};

export const formStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 5,
    width: '90%',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondary: {
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
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
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
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'left',
    fontFamily: 'Figtree-SemiBold',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
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
    color: colors.textDark,
    textAlign: 'center',
  },
  titleContainer: {
    width: '100%',
    paddingLeft: 20,
  },
  listContainer: {
    width: '100%',
    alignItems: 'center',
  },
  flatListContent: {
    alignItems: 'center',
  },
  screenContainerInput: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    width: '100%',
  },
});

export const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    shadowColor: colors.shadowColor,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.0,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
    fontFamily: 'Figtree-Bold',
  },
  text: {
    fontSize: 15,
    color: colors.textMedium,
    marginBottom: 4,
    fontFamily: 'Figtree-Regular',
  },
  price: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
    textAlign: 'right',
  },
});

export const resultStyles = StyleSheet.create({
  item: {
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
  header: {
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
  routeOverview: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  routeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  countryText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  airlinesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  airlinesLabel: {
    fontSize: 14,
    color: colors.textMedium,
    fontWeight: 'bold',
  },
  airlinesText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  airportText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  airportCodeText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: 'bold',
  },
});

export const globalTextStyles = StyleSheet.create({
  default: {
    fontFamily: 'Figtree-Regular',
  },
  bold: {
    fontFamily: 'Figtree-Bold',
  },
  semiBold: {
    fontFamily: 'Figtree-SemiBold',
  },
});
