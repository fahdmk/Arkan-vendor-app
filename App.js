import { createNativeStackNavigator} from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from 'react-native';
import Login from "./Screens/Login";
import Tabs from "./Screens/Tabs";

import { NavigationContainer } from '@react-navigation/native';
export default function App() {
  const {Navigator, Screen} = createNativeStackNavigator();
 
  return (
  <NavigationContainer>
  <Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Screen  name="Login"
        component={Login} />
  <Screen  name="Tabs"
        component={Tabs} />
  </Navigator>
</NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
