import React from 'react';

// Container principal da navegação
import { NavigationContainer } from '@react-navigation/native';

// Stack controla o fluxo (Splash → Login → App)
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Tab controla a barra inferior (Home, Explore, Profile)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Telas do app
import SplashScreen from './pages/SplashScreen';
import LoginScreen from './pages/LoginScreen';
import HomeScreen from './pages/HomeScreen';
import ExploreScreen from './pages/ExploreScreen';
import ProfileScreen from './pages/ProfileScreen';

// Instância do Stack
const Stack = createNativeStackNavigator();

// Instância da Tab
const Tab = createBottomTabNavigator();

// Navegação com barra inferior (área logada)
function TabRoutes() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {/* Cada Tab.Screen é um botão na barra inferior */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Navegação principal do app
export default function Routes() {
  return (
    <NavigationContainer>
      {/* Stack controla a ordem das telas */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* "App" renderiza as Tabs */}
        <Stack.Screen name="App" component={TabRoutes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}