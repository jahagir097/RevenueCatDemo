import {Alert, Platform, StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import Navigation from './src/Navigation';
import {configurePurchases} from './src/Services/ApiService';
const App = () => {
  useEffect(() => {
    configurePurchases();
  }, []);
  return (
    <View style={{flex: 1}}>
      <Navigation />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({});
