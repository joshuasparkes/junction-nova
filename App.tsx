import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import {
  NavigationContainer,
  getFocusedRouteNameFromRoute,
  RouteProp,
} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {globalTextStyles} from './src/styles/commonStyles';
import {
  FlightStackParamList,
  HotelStackParamList,
  TrainStackParamList,
  CarRentalStackParamList,
  MultimodalStackParamList,
  BookingsStackParamList,
} from './src/navigation/types';

import FlightSearchScreen from './src/screens/flights/FlightSearchScreen';
import FlightBookingScreen from './src/screens/flights/FlightBookingScreen';
import HotelSearchScreen from './src/screens/hotels/HotelSearchScreen';
import HotelBookingScreen from './src/screens/hotels/HotelBookingScreen';
import TrainSearchScreen from './src/screens/trains/TrainSearchScreen';
import TrainBookingScreen from './src/screens/trains/TrainBookingScreen';
import TrainBookingHoldScreen from './src/screens/trains/TrainBookingHoldScreen.tsx';
import CarRentalSearchScreen from './src/screens/cars/CarRentalSearchScreen';
import CarRentalBookingScreen from './src/screens/cars/CarRentalBookingScreen';
import BookingSuccessScreen from './src/screens/common/BookingSuccessScreen';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MultimodalSearchScreen from './src/screens/multimodal/MultimodalSearchScreen';
import FlightBookingHoldScreen from './src/screens/flights/FlightBookingHoldScreen';
import BookingsScreen from './src/screens/bookings/BookingsScreen';
import EntryScreen from './src/screens/onboarding/Entry';

const logoImage = require('./assets/logo.png');

const FlightStack = createStackNavigator<FlightStackParamList>();
const HotelStack = createStackNavigator<HotelStackParamList>();
const TrainStack = createStackNavigator<TrainStackParamList>();
const CarRentalStack = createStackNavigator<CarRentalStackParamList>();
const MultimodalStack = createStackNavigator<MultimodalStackParamList>();
const BookingsStack = createStackNavigator<BookingsStackParamList>();
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const commonStackScreenOptions = {
  headerShown: false,
};

function FlightStackNavigator() {
  return (
    <FlightStack.Navigator screenOptions={commonStackScreenOptions}>
      <FlightStack.Screen name="FlightSearch" component={FlightSearchScreen} />
      <FlightStack.Screen
        name="FlightBooking"
        component={FlightBookingScreen}
      />
      <FlightStack.Screen
        name="FlightBookingHoldScreen"
        component={FlightBookingHoldScreen}
      />
      <FlightStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
      />
    </FlightStack.Navigator>
  );
}

function HotelStackNavigator() {
  return (
    <HotelStack.Navigator screenOptions={commonStackScreenOptions}>
      <HotelStack.Screen name="HotelSearch" component={HotelSearchScreen} />
      <HotelStack.Screen name="HotelBooking" component={HotelBookingScreen} />
      <HotelStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
      />
    </HotelStack.Navigator>
  );
}

function TrainStackNavigator() {
  return (
    <TrainStack.Navigator screenOptions={commonStackScreenOptions}>
      <TrainStack.Screen name="TrainSearch" component={TrainSearchScreen} />
      <TrainStack.Screen name="TrainBooking" component={TrainBookingScreen} />
      <TrainStack.Screen
        name="TrainBookingHoldScreen"
        component={TrainBookingHoldScreen}
      />
      <TrainStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
      />
    </TrainStack.Navigator>
  );
}

function CarRentalStackNavigator() {
  return (
    <CarRentalStack.Navigator screenOptions={commonStackScreenOptions}>
      <CarRentalStack.Screen
        name="CarRentalSearch"
        component={CarRentalSearchScreen}
      />
      <CarRentalStack.Screen
        name="CarRentalBooking"
        component={CarRentalBookingScreen}
      />
      <CarRentalStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
      />
    </CarRentalStack.Navigator>
  );
}

function MultimodalStackNavigator() {
  return (
    <MultimodalStack.Navigator screenOptions={commonStackScreenOptions}>
      <MultimodalStack.Screen
        name="MultimodalSearch"
        component={MultimodalSearchScreen}
      />
    </MultimodalStack.Navigator>
  );
}

function BookingsStackNavigator() {
  return (
    <BookingsStack.Navigator screenOptions={commonStackScreenOptions}>
      <BookingsStack.Screen name="BookingsList" component={BookingsScreen} />
    </BookingsStack.Navigator>
  );
}

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = [
    'FlightBooking',
    'HotelBooking',
    'TrainBooking',
    'CarRentalBooking',
    'BookingSuccess',
    'FlightBookingHoldScreen',
  ];
  if (hideOnScreens.includes(routeName ?? '')) {
    return 'none';
  }
  return 'flex';
};

const tabScreenOptions = ({
  route,
}: {
  route: RouteProp<Record<string, object | undefined>, string>;
}): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarStyle: [styles.tabBar, {display: getTabBarVisibility(route)}],
  tabBarActiveTintColor: styles.tabActive.color,
  tabBarInactiveTintColor: styles.tabInactive.color,
  tabBarLabelStyle: styles.tabLabel,
  tabBarIcon: ({color, size, focused}) => {
    let iconName = '';
    const iconSize = focused ? size + 2 : size;

    if (route.name === 'FlightsTab') {
      iconName = 'plane';
    } else if (route.name === 'HotelsTab') {
      iconName = 'bed';
    } else if (route.name === 'TrainsTab') {
      iconName = 'train';
    } else if (route.name === 'CarsTab') {
      iconName = 'car';
    } else if (route.name === 'MultimodalTab') {
      iconName = 'random';
    } else if (route.name === 'BookingsTab') {
      iconName = 'list-alt';
    }
    return <FontAwesome name={iconName} size={iconSize} color={color} />;
  },
  tabBarItemStyle: styles.tabBarItem,
});

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaView style={styles.safeAreaTop} />
      <SafeAreaView style={styles.safeAreaBottom}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={styles.appBackground.backgroundColor}
        />
        <View style={styles.headerContainer}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </View>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Entry" component={EntryScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={tabScreenOptions}
    sceneContainerStyle={{
      backgroundColor: styles.appBackground.backgroundColor,
    }}>
    <Tab.Screen
      name="MultimodalTab"
      component={MultimodalStackNavigator}
      options={{tabBarLabel: 'Multi'}}
    />
    <Tab.Screen
      name="FlightsTab"
      component={FlightStackNavigator}
      options={{tabBarLabel: 'Flights'}}
    />
    <Tab.Screen
      name="HotelsTab"
      component={HotelStackNavigator}
      options={{tabBarLabel: 'Hotels'}}
    />
    <Tab.Screen
      name="TrainsTab"
      component={TrainStackNavigator}
      options={{tabBarLabel: 'Trains'}}
    />
    <Tab.Screen
      name="CarsTab"
      component={CarRentalStackNavigator}
      options={{tabBarLabel: 'Cars'}}
    />
    <Tab.Screen
      name="BookingsTab"
      component={BookingsStackNavigator}
      options={{tabBarLabel: 'Trips'}}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 0,
    backgroundColor: '#f5f5f7',
  },
  safeAreaBottom: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  appBackground: {
    backgroundColor: '#f5f5f7',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: Platform.OS === 'ios' ? 10 : 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f7',
  },
  logo: {
    width: 160,
    height: 45,
  },
  tabBar: {
    backgroundColor: '#f5f5f7',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    height: Platform.OS === 'ios' ? 60 : 70,
  },
  tabBarItem: {
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    color: '#080D4D',
  },
  tabInactive: {
    color: '#BCBCBC',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

// Set default props for Text
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = globalTextStyles.default;

export default App;
