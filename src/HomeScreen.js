import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Purchases from 'react-native-purchases';
import {
  ENTITLEMENT_ID,
  getPlanId,
  getProrationMode,
  getUserInformation,
} from './constants';
import {
  logOutRequest,
  makeRequest,
  makeRequestForGoogle,
} from './Services/ApiService';
import {
  deleteAccount,
  getUserPackage,
  logOut,
  paymentTransfar,
  purchasePackage,
} from './Services/EndPoint';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUniqueId} from 'react-native-device-info';

const HomeScreen = ({navigation}) => {
  const [visible, setVisible] = useState(false);
  const [proUser, setProUser] = useState(false);
  const [offerData, setOfferData] = useState({});
  const [offer, setOffer] = useState([]);
  const [activeIndex, setIndex] = useState(-1);
  const [restore, setRestore] = useState({});
  const [transferLoad, setTransferLoad] = useState(false);

  useEffect(() => {
    getPackages();
    checkUserMembership();
  }, []);
  const getPackages = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (
        offerings.current !== null &&
        offerings.current.availablePackages.length !== 0
      ) {
        setOffer(offerings.current);
      }
    } catch (e) {
      console.log('error offerings:', e);
    }
  };
  const getPackagTypeString = type => {
    switch (type) {
      case 'MONTHLY':
        return 'monthly';
      case 'ANNUAL':
        return 'yearly';
      case 'TWO_MONTH':
        return 'Two Month';
      case 'SIX_MONTH':
        return 'Six Month';
      case 'monthly_package_product':
        return 'Your Current Package: Monthly';
      case 'Yearly_Package_Pro_Product':
        return 'Your Current Package: Yearly';
      case 'yearly_package_pro_product_access':
        return 'Your Current Package: Yearly';
      default:
        break;
    }
  };

  const checkUserMembership = async () => {
    try {
      const purchaserInfo = await makeRequest(getUserPackage);
      setOfferData(purchaserInfo?.data?.result ?? {});
      setProUser(purchaserInfo?.data?.result?.userAccessApp ?? false);
      const userInfo = await getUserInformation();
      if (userInfo?.result.user._id) {
        const {customerInfo} = await Purchases.logIn(
          userInfo?.result?.user._id,
        );
        console.log(`details :${Platform.OS}`, userInfo);
      }
      setIndex(-1);
      setTransferLoad(false);
    } catch (error) {
      setIndex(-1);
      console.log('purchaserInfo  error:', error);
    }
  };

  const modalView = () => {
    return (
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={() => setVisible(false)}>
        <View style={styles.modalContainer}>
          {offer.length == 0 ? (
            <ActivityIndicator />
          ) : (
            offer.availablePackages.map((item, index) => {
              const activePackage = offerData?.allIdentifier?.includes(
                item.product.identifier,
              );
              return (
                <View style={styles.modalView} key={item.identifier}>
                  <View style={styles.insideView}>
                    <Text
                      style={{
                        ...styles.textStyle,
                      }}>
                      <Text
                        style={{
                          ...styles.textStyle,
                          fontWeight: 'bold',
                        }}>
                        {item.product.priceString} /{' '}
                        {getPackagTypeString(item.packageType)}{' '}
                      </Text>
                      {item.product.introPrice &&
                        `after ${item.product.introPrice.periodNumberOfUnits} ${item.product.introPrice.periodUnit} free trial ends.`}
                    </Text>
                  </View>
                  {!activePackage && (
                    <TouchableOpacity
                      onPress={() => {
                        if (offerData.planActive) {
                          restoreHandler(item, index);
                        } else {
                          subscribeHandler(item, index);
                        }
                      }}
                      style={{
                        ...styles.cardContainer,
                        backgroundColor: activePackage ? '#9b9d9e' : '#fff',
                      }}>
                      {activeIndex == index ? (
                        <ActivityIndicator />
                      ) : (
                        <Text style={styles.subscribeText}>subscribe</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
          {activeIndex > -1 ? (
            <View onPress={() => setVisible(false)} style={styles.closeButton}>
              <Text>in Progress</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeButton}>
              <Text>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    );
  };

  const restoreHandler = (item, i) => {
    Alert.alert(
      'Hello',
      'Are you sure to transfer your pervious plan into your current account ? ',
      [
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setIndex(i);
              if (item?.product?.identifier == offerData.paymentId) {
                await modalYesHandler();
                const res = await makeRequest(
                  paymentTransfar,
                  {
                    device_id: await getUniqueId(),
                  },
                  'POST',
                );
                await checkUserMembership();
              } else {
                await modalYesHandler();
                await subscribeHandler(item, i);
              }
            } catch (error) {
              console.log('restoreHandler :', error);
            }
          },
        },
        {
          text: 'No',
          onPress: () => {
            setVisible(false);
          },
          style: 'cancel',
        },
      ],
      {cancelable: false},
      //on clicking out side, Alert will not dismiss
    );
  };

  const getUpdateInfo = async () => {
    if (offerData.paymentId.length > 0 && Platform.OS === 'android') {
      try {
        return {
          oldSku: offerData.paymentId,
          prorationMode: getProrationMode(offerData.paymentId),
        };
      } catch (error) {
        throw error;
      }
    } else {
      return null;
    }
  };

  const subscribeHandler = async (pack, i) => {
    const myObj = {...pack};
    setIndex(i);
    try {
      const userInfo = await getUserInformation();
      if (userInfo?.result.user._id) {
        const {customerInfo} = await Purchases.logIn(
          userInfo?.result?.user._id,
        );
        // console.log('details :', customerInfo.entitlements.active['pro']);
      }
      const upgradeInfo = await getUpdateInfo();
      const response = await Purchases.purchasePackage(myObj, upgradeInfo);
      // await cancelSubscription();
      const apiData = {
        planId: getPlanId(response.productIdentifier),
        status: 'success',
        paymentId: response.productIdentifier,
        alldata: response,
      };
      const res = await makeRequest(purchasePackage, apiData, 'POST');
      await checkUserMembership();
    } catch (error) {
      setIndex(-1);
      if (!error.userCancelled) {
        console.log(`Error handling ${JSON.stringify(error)}`);
      } else {
        console.log(`User cancelled ${JSON.stringify(error)}`);
      }
    }
  };

  const logOutHandler = async () => {
    try {
      const res = await logOutRequest(logOut);
      await AsyncStorage.removeItem('userDetails');
      navigation.replace('SignUpWithEmail');
    } catch (exception) {
      console.log('logout exception', exception);
    }
  };

  const deleteHandler = async () => {
    try {
      const res = await logOutRequest(deleteAccount);
      await AsyncStorage.removeItem('userDetails');
      navigation.replace('SignUpWithEmail');
    } catch (exception) {
      console.log('deleteHandler exception', exception);
    }
  };
  const modalYesHandler = async () => {
    try {
      setTransferLoad(true);
      const restore = await Purchases.restorePurchases();
      if (typeof restore.entitlements.active['pro'] !== 'undefined') {
        console.log('restore :', restore.entitlements.active['pro']);
        setRestore(restore.entitlements.active['pro']);
      }
    } catch (error) {
      setTransferLoad(false);
      console.log('error modalYesHandler', error);
    }
  };

  const cancelSubscription = async () => {
    if (offerData.paymentId.length > 0 && Platform.OS === 'android') {
      try {
        const userData = await getUserInformation();
        const url = `https://api.revenuecat.com/v1/subscribers/${userData.result.user._id}/subscriptions/${offerData.paymentId}/revoke`;
        const res = await makeRequestForGoogle(url, 'POST');
        console.log('res cancelSubscription:', res);
      } catch (error) {
        console.log('error :', error);
        throw error;
      }
    }
  };

  return (
    <View style={styles.screen}>
      {modalView()}
      {proUser ? (
        <>
          <View style={styles.modalView}>
            <View style={styles.insideView}>
              <Text
                style={{
                  ...styles.textStyle,
                  fontWeight: 'bold',
                  color: '#fff',
                }}>
                {'Current plan: ' + offerData?.planId?.name}
              </Text>
              <Text style={styles.normalText}>
                {'Valid Upto: ' + offerData?.expireDate}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setVisible(val => !val)}
            style={styles.continueButton}>
            <Text style={styles.plansText}>manage plan</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => setVisible(val => !val)}
            style={styles.continueButton}>
            <Text style={styles.plansText}>View Plans</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        onPress={logOutHandler}
        style={{...styles.logoutButton, bottom: 80}}>
        <Text style={styles.logouText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={deleteHandler} style={styles.logoutButton}>
        <Text style={styles.logouText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

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
    alignSelf: 'center',
  },
  signUpText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalView: {
    backgroundColor: '#1C122C',
    marginHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  cardContainer: {
    borderColor: '#E6E6E6',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  insideView: {
    paddingBottom: 20,
  },
  bottomView: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  textStyle: {
    fontSize: 24,
    // textAlign: 'center',
    color: '#E6E6E6',
  },
  textPriceStyle: {
    fontSize: 24,
    color: '#E6E6E6',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
  trialView: {
    backgroundColor: '#1C122C',
    paddingVertical: 10,
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginTop: -20,
    position: 'absolute',
  },
  subcribeButton: {
    backgroundColor: '#1C122C',
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 40,
  },
  subcribeText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
  },
  noThanksText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 20,
  },
  plansText: {
    color: '#fff',
    fontSize: 20,
  },
  subscribeText: {
    color: '#000',
    fontSize: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#fff',
    alignSelf: 'center',
    padding: 20,
  },
  normalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 20,
    backgroundColor: '#1C122C',
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 6,
  },
  logouText: {
    color: '#fff',
    fontSize: 15,
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

const kkk = async () => {
  try {
    const {customerInfo} = await Purchases.logIn('ios_User_Id');
    if (
      typeof customerInfo.entitlements.active[ENTITLEMENT_ID] != 'undefined'
    ) {
      console.log(
        'customerInfo :',
        customerInfo.entitlements.active[ENTITLEMENT_ID],
      );
      setOfferData(customerInfo.entitlements.active[ENTITLEMENT_ID]);
      setProUser(true);
    }
  } catch (error) {
    console.log('purchaserInfo  error:', error);
  }
};
