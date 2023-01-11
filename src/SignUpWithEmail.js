import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  configurePurchases,
  makeRequest,
  requestForUserLogin,
} from './Services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUniqueId} from 'react-native-device-info';
import {LoginUrl, paymentTransfar} from './Services/EndPoint';

const SignUpWithEmail = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const contaiuneHandler = async () => {
    setLoading(true);
    try {
      const response = await makeRequest(
        LoginUrl,
        {
          email: email,
          device_id: await getUniqueId(),
          deviceType: Platform.OS,
        },
        'POST',
      );
      const appUserID = response.data?.result?.user?._id ?? '';
      await configurePurchases(appUserID);
      const jsonValue = JSON.stringify(response.data);
      await AsyncStorage.setItem('userDetails', jsonValue);
      setTimeout(() => {
        navigation.replace('HomeScreen');
      }, 1000);
    } catch (error) {
      console.log('error ::', error);
      alert(error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View>
        <View style={{marginBottom: 20}}>
          <Text style={styles.welComeText}>WelCome</Text>
        </View>
        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor=""
          value={email}
          onChangeText={setEmail}
        />
        <View>
          <TouchableOpacity
            onPress={() => contaiuneHandler()}
            style={styles.continueButton}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.signUpText}>{'Sign Up'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SignUpWithEmail;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    height: 48,
    backgroundColor: '#E6E6E6',
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  continueButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: '#1C122C',
    marginTop: 50,
    alignSelf: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
  },
  welComeText: {
    color: '#000',
    fontSize: 24,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
  },
  mainModal: {
    backgroundColor: '#fff',
    marginHorizontal: 17,
    padding: 10,
    borderRadius: 6,
  },
  modalContentDes: {
    fontSize: 20,
    lineHeight: 30,
    color: '#1C122C',
    fontWeight: '400',
  },
  buttonsView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 30,
  },
  buttonStyle: {
    paddingVertical: 16,
    backgroundColor: '#1C122C',
    width: 120,
  },
  buttonTextStyle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});
