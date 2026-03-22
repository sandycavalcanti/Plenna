// App.js é o ponto inicial da aplicação.
// Ele apenas renderiza o componente Routes.
//
// Routes é responsável por toda a navegação do app
// (Splash, Login e as telas com a barra inferior).
// Separar assim deixa o App.js mais limpo e organizado.
import React from 'react';
import Routes from './src/routes';
import { useFonts } from 'expo-font';

export default function App() {

  const [fontsLoaded] = useFonts({
    SugoDisplay: require('./assets/fonts/Sugo-Pro-Display-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Routes />;
}