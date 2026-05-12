import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import EditPreferencesScreen from './pages/EditPreferencesScreen';
import CreateCompraScreen from './pages/CreateCompraScreen';
import { COLORS } from './constants';

// Configuração de deeplinks para OAuth
const linking = {
  prefixes: ['plenna://', 'exp://', 'https://plenna-api-orpin.vercel.app'],
  config: {
    screens: {},
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

// Componente customizado para a TabBar
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 60 + bottomInset,
        bottom: 0,
        paddingTop: 0,
        paddingBottom: bottomInset,
        backgroundColor: '#595D7C',
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            preventDefault: false,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Renderizar apenas as 2 primeiras abas
        if (index > 1) return null;

        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Dashboard') iconName = 'stats-chart';

        const isCloseToPlusButton = route.name === 'Dashboard';

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, marginRight: isCloseToPlusButton ? 30 : 0 }}>
            <Ionicons name={iconName} size={26} color={isFocused ? '#1B2046' : '#EFEFF5'} />
          </TouchableOpacity>
        );
      })}

      {/* Botão + no meio */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          width: 76,
          height: 76,
          borderRadius: 50,
          backgroundColor: '#C97BA0',
          justifyContent: 'center',
          alignItems: 'center',
          bottom: 20 + bottomInset,
          left: '50%',
          marginLeft: -38,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 4,
          borderWidth: 4,
          borderColor: COLORS.fundoPrincipal,
        }}
        onPress={() => {
          // Navega para tela de criação de compra
          navigation.navigate('CreateCompra');
        }}>
        <Ionicons name="add" size={40} color="#FFF" />
      </TouchableOpacity>

      {/* Renderizar as 2 últimas abas */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            preventDefault: false,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Renderizar apenas as 2 últimas abas
        if (index < 2) return null;

        let iconName;
        if (route.name === 'Profile') iconName = 'person';
        else if (route.name === 'HistoricalChat') iconName = 'chatbubbles';

        const isCloseToPlusButton = route.name === 'Profile';

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, marginLeft: isCloseToPlusButton ? 30 : 0 }}>
            <Ionicons name={iconName} size={26} color={isFocused ? '#1B2046' : '#EFEFF5'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TabRoutes() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
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
        <Stack.Screen name="EditPreferences" component={EditPreferencesScreen} />
        <Stack.Screen name="CreateCompra" component={CreateCompraScreen} />
        <Stack.Screen name="App" component={TabRoutes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
