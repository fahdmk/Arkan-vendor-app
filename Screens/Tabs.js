import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import Account from './Tabs/Account';
import Stats from './Tabs/Stats';
import Home from './Tabs/Home';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import EStyleSheet from 'react-native-extended-stylesheet';

const Tab = createBottomTabNavigator();

const Tabs = ({ route }) => {
  const { token } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home':
              return <Entypo name="shop" size={size} color={color} />;
            case 'Statistiques':
              return <MaterialIcons name="query-stats" size={size} color={color} />;
            case 'Compte':
              return <MaterialIcons name="account-circle" size={size} color={color} />;
            default:
              return <Entypo name="shop" size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#53B175',
        tabBarInactiveTintColor: '#181725',
        tabBarLabelStyle: style.tabBarLabelStyle,
      })}
    >
      <Tab.Screen
        name="Mes produits"
        component={Home}
        initialParams={{ token }} 
        options={{ tabBarLabel: ({ color }) => <Text style={[style.tabBarLabelStyle, { color }]}>Produits</Text> }}
      />
      <Tab.Screen
        name="Statistiques"
        component={Stats}
        initialParams={{ token }} 
        options={{ tabBarLabel: ({ color }) => <Text style={[style.tabBarLabelStyle, { color }]}>Statistiques</Text> }}
      />
      <Tab.Screen
        name="Compte"
        component={Account}
        initialParams={{ token }} 
        options={{ tabBarLabel: ({ color }) => <Text style={[style.tabBarLabelStyle, { color }]}>Compte</Text> }}
      />
    </Tab.Navigator>
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
