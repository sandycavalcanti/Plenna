import React from 'react';

// Container principal da navegação
import { NavigationContainer } from '@react-navigation/native';

// Stack controla o fluxo (Splash → Login → App)
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Tab controla a barra inferior (Home, Explore, Profile)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';
import { DefaultTheme } from '@react-navigation/native';

// Telas do app
import SplashScreen from './pages/SplashScreen';
import LoginScreen from './pages/LoginScreen';
import HomeScreen from './pages/HomeScreen';
import DashboardScreen from './pages/DashboardScreen';
import ProfileScreen from './pages/ProfileScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import HistoricalChatScreen from './pages/HistoricalChatScreen';
import ChatScreen from './pages/ChatScreen';
import SignUpScreen from './pages/SignUpScreen';
import QuestionarioScreen from './pages/QuestionarioScreen';
import EditProfileScreen from './pages/EditProfileScreen';

// Configuração de deeplinks para OAuth
const linking = {
  prefixes: ['plenna://', 'exp://', 'https://plenna-api-orpin.vercel.app'],
  config: {
    screens: {
      OAuthSuccess: 'oauth-success',
      OAuthError: 'oauth-error',
    },
  },
};

// Instância do Stack
const Stack = createNativeStackNavigator();

// Instância da Tab
const Tab = createBottomTabNavigator();
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#595D7C',
  },
};

function TabRoutes() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#1B2046',
        tabBarInactiveTintColor: '#EFEFF5',
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          height: 80,
          paddingTop: 10,
          backgroundColor: '#595D7C',
          borderTopWidth: 0,
          shadowColor: '#000', // sombra iO
          shadowOpacity: 0.15,
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Dashboard') iconName = 'stats-chart';
          else if (route.name === 'Profile') iconName = 'person';
          else if (route.name === 'HistoricalChat') iconName = 'chatbubbles';

          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="HistoricalChat" component={HistoricalChatScreen} />
    </Tab.Navigator>
  );
}

// Navegação principal do app
export default function Routes() {
  return (
    <NavigationContainer theme={MyTheme} linking={linking} fallback={<SplashScreen />}>
      {/* Stack controla a ordem das telas */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Questionario" component={QuestionarioScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="OAuthSuccess" component={HomeScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="OAuthError" component={LoginScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="App" component={TabRoutes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
