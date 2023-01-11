import axios from 'axios';
import {Platform} from 'react-native';
import Purchases from 'react-native-purchases';
import {
  API_KEY_ANDROID,
  API_KEY_IOS,
  getUserInformation,
  SpecificKeys,
} from '../constants';

const headers = {'Content-Type': 'application/json'};
export const configurePurchases = async userId => {
  await Purchases.setDebugLogsEnabled(true);
  if (Platform.OS === 'ios') {
    try {
      Purchases.configure({apiKey: API_KEY_IOS, appUserID: userId});
    } catch (error) {
      console.log('error configure ios', error);
      throw error;
    }
  } else if (Platform.OS === 'android') {
    try {
      Purchases.configure({
        apiKey: API_KEY_ANDROID,
        appUserID: userId,
      });
    } catch (error) {
      console.log('error configure android', error);
      throw error;
    }
  }
};

export const requestForUserLogin = async (email, deviceId) => {
  try {
    const response = await fetch(
      LoginUrl,
      {
        email: email,
        device_id: deviceId,
        deviceType: Platform.OS,
      },
      {
        headers: headers,
      },
    );
    const responseJson = await response.json();

    return responseJson;
  } catch (error) {
    throw new Error(error);
  }
};

export const makeRequest = async (url, data = {}, method = 'GET') => {
  const userInfo = await getUserInformation();
  const apiHeaders = {...headers};
  if (userInfo != null && userInfo?.result?.token != null) {
    apiHeaders['authorization'] = 'Bearer ' + userInfo.result.token;
  }
  const apiData = method == 'POST' ? JSON.stringify(data) : null;
  try {
    const response = await fetch(url, {
      method: method,
      headers: apiHeaders,
      body: apiData,
    });
    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    throw error;
  }
};

export const logOutRequest = async url => {
  const userInfo = await getUserInformation();
  const apiHeaders = {
    ...headers,
    ['authorization']: 'Bearer ' + userInfo.result.token,
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: apiHeaders,
      body: null,
    });
    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    throw new Error(error);
  }
};

export const makeRequestForGoogle = async (url, method = 'GET', data) => {
  const apiData = method == 'POST' ? JSON.stringify(data) : null;
  const apiHeaders = {
    ...headers,
    ['Authorization']: 'Bearer ' + SpecificKeys,
    ['accept']: 'application/json',
  };
  console.log(' apiHeaders:', url);
  try {
    const response = await fetch(url, {
      method: method,
      headers: apiHeaders,
      body: null,
    });
    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    throw new Error(error);
  }
};
