import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_KEY_IOS = 'appl_JrhUQfylERHelDmbGIvoIDGpoTA';
export const API_KEY_ANDROID = 'goog_TifECqzvQcYihXFBshgqDbppDoP';
export const SpecificKeys = 'sk_rimTAFEpvsFbvtuYtVjhCUdbnsaLD';

export const ENTITLEMENT_ID = 'pro';

export const getUserInformation = async () => {
  const value = await AsyncStorage.getItem('userDetails');
  const detail = JSON.parse(value);
  return detail;
};

export const monthlyPlanID = '63aa8ae24ecdc55c6101860f';
export const yearlyPlanID = '63aa8b574ecdc55c61018611';

export const getPlanId = planType => {
  switch (planType) {
    case 'monthly_package_product':
      return monthlyPlanID;
    case 'Yearly_Package_Pro_Product':
      return yearlyPlanID;
    case 'yearly_package_pro_product_access':
      return yearlyPlanID;
    default:
      break;
  }
};

export const getProrationMode = planType => {
  switch (planType) {
    case 'monthly_package_product':
      return 1;
    case 'Yearly_Package_Pro_Product':
      return 4;
    case 'yearly_package_pro_product_access':
      return 4;
    default:
      break;
  }
};
