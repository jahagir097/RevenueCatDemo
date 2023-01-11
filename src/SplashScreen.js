import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {configurePurchases} from './Services/ApiService';
import {getUserInformation} from './constants';

const SplashScreen = ({navigation}) => {
  const checkUserLogged = async () => {
    try {
      const value = await getUserInformation();
      if (value !== null) {
        await configurePurchases(value.result.user._id);
        setTimeout(() => {
          navigation.replace('HomeScreen');
        }, 2000);
      } else {
        setTimeout(() => {
          navigation.replace('SignUpWithEmail');
        }, 1000);
      }
    } catch (e) {
      console.log(' checkUserLogged Error', e);
      // error reading value
    }
  };

  useEffect(() => {
    checkUserLogged();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.welComeText}>Loading...</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welComeText: {
    fontSize: 24,
    color: '#000',
  },
});
