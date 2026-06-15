import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, KeyboardAvoidingView } from 'react-native';
import { styles } from './styles';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  function handleLogin() {
    navigation.navigate('Login');
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'}>
        <View style={styles.container}>
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text style={styles.titulo}>Recuperar senha!</Text>
          <View style={styles.overlay}>
            {/* PASSO 1 - EMAIL */}
            {step === 1 && (
              <>
                <Text style={styles.texto}>Digite seu e-mail</Text>
                <CustomTextInput placeholder="Email" />
                <CustomButton title="Enviar código" onPress={() => setStep(2)} />
              </>
            )}

            {/* PASSO 2 - CÓDIGO */}
            {step === 2 && (
              <>
                <Text style={styles.texto}>Digite o código enviado</Text>
                <CustomTextInput placeholder="Código" />
                <CustomButton title="Verificar" onPress={() => setStep(3)} />
              </>
            )}

            {/* PASSO 3 - NOVA SENHA */}
            {step === 3 && (
              <>
                <Text style={styles.texto}>Crie uma nova senha</Text>
                <CustomTextInput placeholder="Nova senha" secureTextEntry />
                <CustomTextInput placeholder="Confirmar senha" secureTextEntry />
                <CustomButton title="Alterar senha" onPress={handleLogin} />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
