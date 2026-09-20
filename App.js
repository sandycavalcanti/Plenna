// App.js é o ponto inicial da aplicação.
// Ele apenas renderiza o componente Routes.
//
// Routes é responsável por toda a navegação do app
// (Splash, Login e as telas com a barra inferior).
// Separar assim deixa o App.js mais limpo e organizado.
import React, { useEffect } from 'react';
import Routes from './src/routes';
import { useFonts } from 'expo-font';
import { subscribeToProtectedAppState } from './src/services/security/protectedSession';

export default function App() {
  useEffect(() => {
    // O listener vive no ponto mais alto do app para invalidar a sessão
    // protegida mesmo quando Purchases não está atualmente em foco. Assim,
    // voltar do background nunca reutiliza um desbloqueio antigo.
    return subscribeToProtectedAppState();
  }, []);

  const [fontsLoaded] = useFonts({
    SugoDisplay: require('./assets/fonts/Sugo-Pro-Display-Regular.ttf'),

  });

  if (!fontsLoaded) {
    return null;
  }

  return <Routes />;
}
