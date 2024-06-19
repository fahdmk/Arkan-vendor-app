import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import Home from './tabs/Home/Home';
// import Account from './tabs/Account';
import Account from './Tabs/Account';
import Stats from './Tabs/Stats';
import Home from './Tabs/Home';
import { MaterialIcons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import EStyleSheet from 'react-native-extended-stylesheet';

const {Navigator, Screen} = createBottomTabNavigator();

const Tabs = () => {
  return (
    <Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color}) => {
          switch (route.name) {
            case Account.name:
              return <MaterialIcons name="account-circle" size={24} color="black" />;
            case Stats.name:
              return <MaterialIcons name="query-stats" size={24} color="black" />;
            default:
                return <Entypo name="shop" size={24} color="black" />;
          }
        },
      })}
      tabBarOptions={{
        activeTintColor: '#53B175',
        inactiveTintColor: '#181725',
        labelStyle: style.tabBarLabelStyle,
      }}>
      <Screen name="Home" component={Home} />
      <Screen name="Stats" component={Stats} />
      <Screen name="Account" component={Account} /> 
    </Navigator>
  );
};

const style = EStyleSheet.create({
  tabBarLabelStyle: {
    fontFamily: '$gilroyNormal600',
    fontWeight: '600',
    fontSize: '0.75rem',
  },
});

export default Tabs;