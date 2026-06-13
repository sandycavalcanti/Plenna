import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(14)).current;
  const logoSway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada curta para deixar o ícone legível logo no início.
    const intro = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.spring(logoLift, {
        toValue: 0,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]);

    const logoFloat = Animated.loop(
      Animated.sequence([
        Animated.timing(logoSway, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoSway, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    intro.start();
    logoFloat.start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => {
      clearTimeout(timer);
      logoFloat.stop();
    };
  }, [logoLift, logoOpacity, logoScale, logoSway, navigation]);

  const swayY = logoSway.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const swayScale = logoSway.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const swayRotate = logoSway.interpolate({
    inputRange: [0, 1],
    outputRange: ['-1.25deg', '1.25deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.splashFundo} />

      <View style={styles.background} pointerEvents="none">
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
        <View style={styles.diagonalBandTop} />
        <View style={styles.diagonalBandBottom} />
      </View>

      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoLift }, { scale: logoScale }, { scale: swayScale }, { translateY: swayY }, { rotate: swayRotate }],
          },
        ]}>
        <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}
