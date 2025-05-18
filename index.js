/**
 * @format
 */

import 'react-native-get-random-values'; // THIS MUST BE THE FIRST IMPORT

import {enableScreens} from 'react-native-screens';

enableScreens(); // Call this before AppRegistry.registerComponent

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
