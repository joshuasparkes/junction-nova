import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types'; // Adjust the path as needed
import {colors, buttonStyles} from '../../styles/commonStyles'; // Import common styles

type EntryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Entry'
>;

type Props = {
  navigation: EntryScreenNavigationProp;
};

const EntryScreen: React.FC<Props> = ({navigation}) => {
  const handlePress = () => {
    navigation.replace('Main'); // Navigate to the Main stack
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/onboarding-image.png')}
          style={styles.image}
        />
        <Text style={styles.title}>Create memories</Text>
        <Text style={styles.description}>
          Discover the world and create memories that will last a lifetime.
        </Text>
      </View>
      <TouchableOpacity
        style={[buttonStyles.primary, styles.fixedButton]}
        onPress={handlePress}>
        <Text style={buttonStyles.primaryText}>Let's go!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.textDark,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: colors.textMedium,
  },
  fixedButton: {
    position: 'absolute',
    bottom: 30,
  },
});

export default EntryScreen;
