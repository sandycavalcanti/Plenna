import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from './styles';
import CustomButton from '../../components/CustomButton';
import { COLORS } from '../../constants';
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';

const discomfortOptions = ['Uso excessivo do celular', 'Compras por impulso', 'Falta de controle', 'Quero entender meus habitos', 'So curiosidade'];
const screenTimeOptions = ['Pouco (ate 2h)', 'Moderado (2-5h)', 'Alto (5-8h)', 'Muito alto (+8h)'];
const triggerOptions = ['Promocao relampago', 'Anuncios', 'Influencia de pessoas', 'Tedio', 'Ansiedade', 'Nao sei'];

function manterSomenteDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function formatarTelefoneParaTela(digitos) {
  const numeros = manterSomenteDigitos(digitos).slice(0, 11);

  if (!numeros) {
    return '';
  }

  const ddd = numeros.slice(0, 2);
  const restante = numeros.slice(2);

  if (numeros.length <= 2) {
    return `(${ddd}`;
  }

  if (numeros.length <= 6) {
    return `(${ddd}) ${restante}`;
  }

  if (numeros.length <= 10) {
    return `(${ddd}) ${restante.slice(0, 4)}-${restante.slice(4)}`;
  }

  return `(${ddd}) ${restante.slice(0, 5)}-${restante.slice(5, 9)}`;
}

function formatarDataParaTela(digitos) {
  const numeros = manterSomenteDigitos(digitos).slice(0, 8);

  if (!numeros) {
    return '';
  }

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

function extrairDigitosDaData(valor) {
  return manterSomenteDigitos(valor).slice(0, 8);
}

function dataBancoParaEntrada(valor) {
  const texto = String(valor || '').trim();

  if (!texto) {
    return '';
  }

  if (texto.includes('-')) {
    const [ano, mes, dia] = texto.split('T')[0].split('-');

    if (ano && mes && dia) {
      return `${dia}${mes}${ano}`.slice(0, 8);
    }
  }

  return extrairDigitosDaData(texto);
}

function dataBRParaBanco(digitos) {
  if (digitos.length !== 8) {
    return null;
  }

  const dia = Number(digitos.slice(0, 2));
  const mes = Number(digitos.slice(2, 4));
  const ano = Number(digitos.slice(4, 8));
  const data = new Date(ano, mes - 1, dia);

  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }

  return new Date(Date.UTC(ano, mes - 1, dia)).toISOString();
}

function telefoneEhValido(digitos) {
  return manterSomenteDigitos(digitos).length === 11;
}

function todosCamposPreenchidos(campos) {
  return campos.every((campo) => String(campo || '').trim().length > 0);
}

export default function QuestionarioScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [digitalDiscomfort, setDigitalDiscomfort] = useState('');
  const [screenTime, setScreenTime] = useState('');
  const [consumptionTrigger, setConsumptionTrigger] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const phoneVisual = formatarTelefoneParaTela(phone);
  const birthDateVisual = formatarDataParaTela(birthDate);
  const phoneDigits = manterSomenteDigitos(phone);
  const birthDateDigits = extrairDigitosDaData(birthDate);
  const phoneValido = telefoneEhValido(phoneDigits);
  const birthDateValida = dataBRParaBanco(birthDateDigits) !== null;
  const podeSalvar = !loading;

  // Carrega dados do usuário se estiver autenticado
  async function carregarUsuario() {
    setLoading(true);
    try {
      const response = await apiClient.get('/users/user');
      const u = response.data;
      setPhone(manterSomenteDigitos(u.usuario_telefone || ''));
      setBirthDate(dataBancoParaEntrada(u.usuario_data_nascimento || ''));
      setDigitalDiscomfort(u.usuario_incomodo_consumo || '');
      setScreenTime(u.usuario_tempo_tela || '');
      setConsumptionTrigger(u.usuario_gatilho_consumo || '');
      setIsEditing(true);
    } catch (error) {
      // Pode não estar autenticado (fluxo de cadastro) — apenas logar
      CatchError(error);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarUsuario() {
    if (!todosCamposPreenchidos([phoneDigits, birthDateDigits, digitalDiscomfort, screenTime, consumptionTrigger])) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos antes de continuar.');
      return;
    }

    if (!phoneValido) {
      Alert.alert('Telefone inválido', 'Digite um telefone com 11 dígitos.');
      return;
    }

    const dataNascimentoBanco = dataBRParaBanco(birthDateDigits);

    if (!dataNascimentoBanco) {
      Alert.alert('Data inválida', 'Digite uma data de nascimento válida no formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/users', {
        telefone: phoneDigits,
        dataNascimento: dataNascimentoBanco,
        incomodoConsumo: digitalDiscomfort,
        tempoTela: screenTime,
        gatilhoConsumo: consumptionTrigger,
      });
      Alert.alert('Sucesso', 'Cadastro atualizado com sucesso!');
      navigation.replace('App');
    } catch (error) {
      CatchError(error);
    } finally {
      setSaving(false);
    }
  }

  React.useEffect(() => {
    carregarUsuario();
  }, []);

  const renderOptionGroup = (title, options, selectedValue, onSelect) => (
    <View style={styles.questionBlock}>
      <Text style={styles.questionTitle}>{title}</Text>

      <View style={styles.optionsWrap}>
        {options.map((option) => {
          const isSelected = selectedValue === option;

          return (
            <TouchableOpacity key={option} activeOpacity={0.85} style={[styles.optionPill, isSelected && styles.optionPillSelected]} onPress={() => onSelect(option)}>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: COLORS.cadFundo }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('App')} activeOpacity={0.85}>
        <Text style={styles.skipButtonText}>Pular</Text>
      </TouchableOpacity>
      <View style={styles.heroCard}>
        <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
        <View style={styles.titleRow}>
          <Text style={styles.badge}>Opcional</Text>
        </View>
        <Text style={styles.titulo}>Finalize seu perfil</Text>
        <Text style={styles.subtitle}>Essas respostas ajudam a personalizar sua experiência, mas você pode continuar sem preencher agora.</Text>
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>Telefone</Text>
        <TextInput
          value={phoneVisual}
          onChangeText={(texto) => setPhone(manterSomenteDigitos(texto).slice(0, 11))}
          placeholder="(00) 00000-0000"
          placeholderTextColor={COLORS.questionarioPlaceholder}
          keyboardType="phone-pad"
          style={styles.stepThreeInput}
          maxLength={15}
        />
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>Data de nascimento</Text>
        <TextInput
          value={birthDateVisual}
          onChangeText={(texto) => setBirthDate(extrairDigitosDaData(texto))}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={COLORS.questionarioPlaceholder}
          keyboardType="numeric"
          style={styles.stepThreeInput}
          maxLength={10}
        />
      </View>

      {renderOptionGroup('O que mais te incomoda no seu consumo digital?', discomfortOptions, digitalDiscomfort, setDigitalDiscomfort)}

      {renderOptionGroup('Quanto tempo voce acha que passa no celular?', screenTimeOptions, screenTime, setScreenTime)}

      {renderOptionGroup('O que mais te faz comprar ou consumir algo?', triggerOptions, consumptionTrigger, setConsumptionTrigger)}

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.cadTitulo} />
      ) : isEditing ? (
        <View style={styles.actionsArea}>
          <CustomButton title={saving ? 'Salvando...' : 'Salvar respostas'} style={styles.stepThreeButton} onPress={atualizarUsuario} disabled={!podeSalvar || saving} />
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.replace('App')} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Deixar para depois</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionsArea}>
          <CustomButton title="Concluir cadastro" onPress={() => navigation.replace('App')} />
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.replace('App')} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
