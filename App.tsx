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

import {
  FlightStackParamList,
  HotelStackParamList,
  TrainStackParamList,
  CarRentalStackParamList,
} from './src/navigation/types';

import FlightSearchScreen from './src/screens/flights/FlightSearchScreen';
import FlightBookingScreen from './src/screens/flights/FlightBookingScreen';
import HotelSearchScreen from './src/screens/hotels/HotelSearchScreen';
import HotelBookingScreen from './src/screens/hotels/HotelBookingScreen';
import TrainSearchScreen from './src/screens/trains/TrainSearchScreen';
import TrainBookingScreen from './src/screens/trains/TrainBookingScreen';
import CarRentalSearchScreen from './src/screens/cars/CarRentalSearchScreen';
import CarRentalBookingScreen from './src/screens/cars/CarRentalBookingScreen';
import BookingSuccessScreen from './src/screens/common/BookingSuccessScreen';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

const logoImage = require('./assets/logo.png');

const FlightStack = createStackNavigator<FlightStackParamList>();
const HotelStack = createStackNavigator<HotelStackParamList>();
const TrainStack = createStackNavigator<TrainStackParamList>();
const CarRentalStack = createStackNavigator<CarRentalStackParamList>();
const Tab = createBottomTabNavigator();

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

// Moved screenOptions outside the App component
const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = [
    'FlightBooking',
    'HotelBooking',
    'TrainBooking',
    'CarRentalBooking',
    'BookingSuccess',
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
  tabBarIcon: ({color, size}) => {
    let iconName = '';

    if (route.name === 'FlightsTab') {
      iconName = 'plane';
    } else if (route.name === 'HotelsTab') {
      iconName = 'bed';
    } else if (route.name === 'TrainsTab') {
      iconName = 'train';
    } else if (route.name === 'CarsTab') {
      iconName = 'car';
    }
    return <FontAwesome name={iconName} size={size} color={color} />;
  },
});

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={styles.appBackground.backgroundColor}
        />
        <View style={styles.headerContainer}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </View>
        <NavigationContainer>
          <Tab.Navigator screenOptions={tabScreenOptions}>
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
              options={{tabBarLabel: 'Car Rental'}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  appBackground: {
    backgroundColor: '#022E79',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#022E79',
  },
  headerContainer: {
    paddingVertical: Platform.OS === 'ios' ? 15 : 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#022E79',
  },
  logo: {
    width: 180,
    height: 50,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
  },
  tabBar: {
    backgroundColor: '#012460',
    borderTopColor: '#011f50',
    height: Platform.OS === 'ios' ? 60 : 60,
  },
  tabActive: {
    color: '#FFFFFF',
  },
  tabInactive: {
    color: '#A0A0A0',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default App;
