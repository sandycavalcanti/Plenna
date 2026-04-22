import React, { useState } from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';

const discomfortOptions = [
  'Uso excessivo do celular',
  'Compras por impulso',
  'Falta de controle',
  'Quero entender meus habitos',
  'So curiosidade',
];

const screenTimeOptions = [
  'Pouco (ate 2h)',
  'Moderado (2-5h)',
  'Alto (5-8h)',
  'Muito alto (+8h)',
];

const triggerOptions = [
  'Promocao relampago',
  'Anuncios',
  'Influencia de pessoas',
  'Tedio',
  'Ansiedade',
  'Nao sei',
];

export default function SignUpScreen({ navigation }) {

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [digitalDiscomfort, setDigitalDiscomfort] = useState('');
  const [screenTime, setScreenTime] = useState('');
  const [consumptionTrigger, setConsumptionTrigger] = useState('');

  const renderOptionGroup = (title, options, selectedValue, onSelect) => (
    <View style={styles.questionBlock}>
      <Text style={styles.questionTitle}>{title}</Text>

      <View style={styles.optionsWrap}>
        {options.map((option) => {
          const isSelected = selectedValue === option;

          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.85}
              style={[styles.optionPill, isSelected && styles.optionPillSelected]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

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
              Adicionar limites por segmento +
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

          <CustomButton title="Finalizar" style={styles.button} onPress={() => setStep(3)} />

        </View>
      )}

      {step === 3 && (
        <View style={styles.stepThreeContainer}>
          <Text style={styles.stepThreeTitle}>Questionario</Text>

          <ScrollView
            style={styles.stepThreeScroll}
            contentContainerStyle={styles.stepThreeContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.questionBlock}>
              <Text style={styles.questionTitle}>Telefone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                style={styles.stepThreeInput}
              />
            </View>

            <View style={styles.questionBlock}>
              <Text style={styles.questionTitle}>Data de nascimento</Text>
              <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                style={styles.stepThreeInput}
              />
            </View>

            {renderOptionGroup(
              'O que mais te incomoda no seu consumo digital?',
              discomfortOptions,
              digitalDiscomfort,
              setDigitalDiscomfort,
            )}

            {renderOptionGroup(
              'Quanto tempo voce acha que passa no celular?',
              screenTimeOptions,
              screenTime,
              setScreenTime,
            )}

            {renderOptionGroup(
              'O que mais te faz comprar ou consumir algo?',
              triggerOptions,
              consumptionTrigger,
              setConsumptionTrigger,
            )}

            <CustomButton
              title="Concluir cadastro"
              style={styles.stepThreeButton}
              onPress={() => navigation.navigate('App')}
            />
          </ScrollView>
        </View>
      )}

    </KeyboardAvoidingView>
  );
  
}
