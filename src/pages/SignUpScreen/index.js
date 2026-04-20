import React, { useState } from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';

export default function SignUpScreen({ navigation }) {

  const [step, setStep] = useState(1);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />

      {step === 1 && (
        <View style={styles.overlay}>
          <CustomTextInput placeholder="Como devemos te chamar?" />
          <CustomTextInput placeholder="E-mail" secureTextEntry />
          <CustomTextInput placeholder="Senha" secureTextEntry />
          <CustomTextInput placeholder="Confirmação da senha" secureTextEntry />
          <CustomButton title="Cadastrar" style={styles.button} onPress={() => setStep(2)} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepTwoContainer}>
          <Text style={styles.titulo}>Preferências</Text>
          <View style={styles.borderOverlay}>
            <LimitSlider title="Limite mensal de gasto" min={0} max={2000} step={10} initialValue={290} valor compact />
            <LimitSlider title="Limite de tempo em e-commerces" min={0} max={360} step={10} initialValue={90} horas compact />
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.segmentAction}>
            <Text style={styles.segmentActionText}>
              Adicionar limites por segmento <Text style={styles.segmentPlus}>+</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxText}>Autorizo vincular meu e-mail ao Plenna</Text>
          </View>

          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxText}>
              Li e concordo com os <Text style={styles.checkboxLink}>termos</Text>
            </Text>
          </View>

          <CustomButton title="Finalizar" style={styles.button} onPress={() => setStep(2)} />

        </View>
      )}
    </KeyboardAvoidingView>
  );
}
