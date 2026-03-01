import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { styles } from './styles';

// Tela inicial exibida ao abrir o app
// Fica visível por 2 segundos e redireciona para o Login
export default function SplashScreen({ navigation }) {

  useEffect(() => {
    // Timer para trocar automaticamente de tela
    const timer = setTimeout(() => {
      // replace evita que o usuário volte para a Splash
      navigation.replace('Login');
    }, 2000);

    // Limpa o timer ao desmontar o componente
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo centralizada na tela */}
      <Image
        source={require('../../../assets/logoPlenna.png')}
        style={styles.logo}
      />
    </View>
  );
}