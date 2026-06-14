import React, { useEffect, useState, useRef } from 'react';
import { styles } from './styles';
import { ActivityIndicator, Alert, BackHandler, FlatList, Modal, Pressable, Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import PreferencesForm from '../../components/PreferencesForm';
import { valorMonetarioParaNumero } from '../../components/CustomTextInput/currency';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants';
import { apiClient } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '../../api/tokenStorage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
const discomfortOptions = ['Uso excessivo do celular', 'Compras por impulso', 'Falta de controle', 'Quero entender meus habitos', 'So curiosidade'];

const screenTimeOptions = ['Pouco (ate 2h)', 'Moderado (2-5h)', 'Alto (5-8h)', 'Muito alto (+8h)'];

const triggerOptions = ['Promocao relampago', 'Anuncios', 'Influencia de pessoas', 'Tedio', 'Ansiedade', 'Nao sei'];

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

export default function SignUpScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const limiteGasto = useRef(0);
  const limiteTempo = useRef(0);

  const [stepOneTouched, setStepOneTouched] = useState({
    nome: false,
    email: false,
    senha: false,
    confirmacaoSenha: false,
  });
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [digitalDiscomfort, setDigitalDiscomfort] = useState('');
  const [screenTime, setScreenTime] = useState('');
  const [consumptionTrigger, setConsumptionTrigger] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [limiteGastoValor, setLimiteGastoValor] = useState(290);
  const [quantidadeComprasMes, setQuantidadeComprasMes] = useState('');
  const [valorMaximoCompra, setValorMaximoCompra] = useState('');
  const [stepTwoTouched, setStepTwoTouched] = useState(false);
  const [stepTwoAttempted, setStepTwoAttempted] = useState(false);
  const [checkboxAutorizacao, setCheckboxAutorizacao] = useState(false);
  const [checkboxTermos, setCheckboxTermos] = useState(false);

  useEffect(() => {
    const sub = Linking.addEventListener('url', (event) => {
      const url = event.url;

      if (url.includes('oauth-success')) {
        WebBrowser.dismissBrowser();
        setStep(2);
      }

      if (url.includes('oauth-error')) {
        WebBrowser.dismissBrowser();
        Alert.alert('Erro ao conectar email');
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (step !== 2) {
      return undefined;
    }

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(1);
      return true;
    });

    return () => backSubscription.remove();
  }, [step]);

  const nomeValido = nome.trim().length >= 2;
  const emailValido = EMAIL_REGEX.test(email.trim());
  const senhaValida = senha.length >= 6 && (/[0-9]/.test(senha) || /[^A-Za-z0-9\s]/.test(senha));
  const confirmacaoSenhaValida = confirmacaoSenha.length > 0 && confirmacaoSenha === senha;

  const mostrarErroNome = stepOneAttempted || stepOneTouched.nome;
  const mostrarErroEmail = stepOneAttempted || stepOneTouched.email;
  const mostrarErroSenha = stepOneAttempted || stepOneTouched.senha;
  const mostrarErroConfirmacao = stepOneAttempted || stepOneTouched.confirmacaoSenha;

  const nomeErro = mostrarErroNome && !nomeValido ? 'O nome precisa ter no mínimo 2 letras.' : '';
  const emailErro = mostrarErroEmail && !emailValido ? 'Digite um e-mail válido.' : '';
  const senhaErro = mostrarErroSenha && !senhaValida ? 'A senha precisa ter 6 caracteres e 1 número ou caractere especial.' : '';
  const confirmacaoSenhaErro = mostrarErroConfirmacao && !confirmacaoSenhaValida ? 'A confirmação precisa ser igual à senha.' : '';

  const stepOneInvalido = !nomeValido || !emailValido || !senhaValida || !confirmacaoSenhaValida;
  const somaCategoriasSelecionadas = obterSomaLimitesCategorias(selectedCategories);
  const limiteMensalAtual = Number(limiteGastoValor) || 0;
  const excessoCategorias = Math.max(0, somaCategoriasSelecionadas - limiteMensalAtual);
  const stepTwoInvalido = excessoCategorias > 0;
  const mostrarErroStepTwo = (stepTwoTouched || stepTwoAttempted) && stepTwoInvalido;
  const stepTwoErro = mostrarErroStepTwo ? `A soma dos limites por categoria não pode exceder o limite mensal.` : '';

  function atualizarCampo(setter, campo, valor) {
    setter(valor);
    setStepOneTouched((prev) => ({
      ...prev,
      [campo]: true,
    }));
  }

  function fecharTelinhaCategorias() {
    setCategoryModalVisible(false);
  }

  function obterSomaLimitesCategorias(categorias) {
    return categorias.reduce((total, categoria) => total + (categoria.limite || 0), 0);
  }

  function ajustarLimiteGastoParaCategorias(categorias) {
    const somaCategorias = obterSomaLimitesCategorias(categorias);

    if (limiteGastoValor < somaCategorias) {
      setLimiteGastoValor(somaCategorias);
    }
  }

  function selecionarCategoria(category) {
    setStepTwoTouched(true);

    setSelectedCategories((prevCategories) => {
      const exists = prevCategories.some((item) => item.categoria_id === category.categoria_id);

      if (exists) {
        return prevCategories;
      }

      const nextCategories = [
        ...prevCategories,
        {
          ...category,
          limite: 0,
        },
      ];

      ajustarLimiteGastoParaCategorias(nextCategories);

      return nextCategories;
    });

    fecharTelinhaCategorias();
  }

  function atualizarLimiteCategoria(categoriaId, novoValor) {
    setStepTwoTouched(true);

    setSelectedCategories((prevCategories) => {
      const nextCategories = prevCategories.map((item) =>
        item.categoria_id === categoriaId
          ? {
              ...item,
              limite: novoValor,
            }
          : item,
      );

      ajustarLimiteGastoParaCategorias(nextCategories);

      return nextCategories;
    });
  }

  function removerCategoria(categoriaId) {
    setStepTwoTouched(true);

    setSelectedCategories((prevCategories) => {
      const nextCategories = prevCategories.filter((item) => item.categoria_id !== categoriaId);

      ajustarLimiteGastoParaCategorias(nextCategories);

      return nextCategories;
    });
  }

  async function CadastrarUsuario() {
    try {
      setStepOneAttempted(true);
      if (stepOneInvalido) {
        Alert.alert('Campos inválidos', 'Confira os campos em vermelho.');
        return;
      }
      await apiClient.get('/users/email/' + email.trim());
      Alert.alert('E-mail já cadastrado', 'Use outro e-mail.');
      return;
    } catch (error) {
      logApiErrors(error, 'Erro ao verificar email');
    }

    try {
      const registerPayload = {
        nome: nome.trim(),
        email: email.trim(),
        senha,
      };
      await apiClient.post('/auth/register', registerPayload);
      const loginResponse = await apiClient.post('/auth/login', {
        email: email.trim(),
        senha,
      });
      await tokenStorage.setToken(loginResponse.data.token);
      if (checkboxAutorizacao) {
        await vincularEmailGoogle();
      } else {
        setStep(2);
      }
    } catch (error) {
      logApiErrors(error, 'Erro ao cadastrar usuário');
    }
  }

  function listarCategorias() {
    setCategoriesLoading(true);
    apiClient
      .get('/categories')
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => logApiErrors(error, 'Erro ao listar categorias'))
      .finally(() => {
        setCategoriesLoading(false);
      });
  }

  async function AtualizarUsuario() {
    try {
      setStepTwoAttempted(true);
      if (stepTwoInvalido) {
        Alert.alert('Limites inválidos', 'A soma dos limites por categoria não pode ultrapassar o limite mensal de gasto.');
        return;
      }
      const limiteMensal = Number(limiteGastoValor) || 0;
      const categoriasBase = [...selectedCategories];
      const somaCategorias = obterSomaLimitesCategorias(categoriasBase);
      if (limiteMensal > somaCategorias) {
        const sobra = limiteMensal - somaCategorias;
        const indiceOutros = categoriasBase.findIndex((category) => category.categoria_id === 14);
        if (indiceOutros >= 0) {
          const limiteAtualOutros = Number(categoriasBase[indiceOutros].limite) || 0;
          categoriasBase[indiceOutros] = {
            ...categoriasBase[indiceOutros],
            limite: limiteAtualOutros + sobra,
          };
        } else {
          const categoriaOutros = categories.find((category) => category.categoria_id === 14);
          categoriasBase.push({
            categoria_id: 14,
            categoria_nome: categoriaOutros?.categoria_nome || 'Outros',
            limite: sobra,
          });
        }
      }

      // Primeiro, atualizar dados do usuário (quantidade de compras, meta mensal e maior valor por compra)
      try {
        const payload = {};

        if (quantidadeComprasMes) {
          const num = Number(quantidadeComprasMes.replace(/\D/g, ''));
          if (!Number.isNaN(num)) payload.limiteCompra = num;
        }

        if (limiteMensal) {
          payload.metaValorMensal = limiteMensal;
        }

        if (valorMaximoCompra) {
          const valorMaximoCompraNumerico = valorMonetarioParaNumero(valorMaximoCompra);
          if (!Number.isNaN(valorMaximoCompraNumerico)) {
            payload.metaValorCompra = valorMaximoCompraNumerico;
          }
        }

        if (limiteTempo.current !== undefined && limiteTempo.current !== null) {
          payload.metaTempo = Number(limiteTempo.current);
        }

        // Enviar apenas se houver algo para atualizar
        if (Object.keys(payload).length > 0) {
          await apiClient.put('/users', payload);
        }
      } catch (error) {
        // Não bloquear o fluxo principal por erro aqui, mas logar o erro
        logApiErrors(error, 'Erro ao atualizar dados do usuário');
      }

      // Em seguida, persistir preferências por categoria (substitui existentes para evitar duplicação)
      await apiClient.put('/preferencia/bulk', {
        preferencias: categoriasBase.map((category) => ({
          categoriaId: category.categoria_id,
          metaMensal: category.limite,
        })),
      });

      setSelectedCategories(categoriasBase);

      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Questionario'),
        },
      ]);
    } catch (error) {
      logApiErrors(error, 'Erro ao salvar metas');
    }
  }

  async function vincularEmailGoogle() {
    try {
      const response = await apiClient.get('/email/connect');
      const authUrl = response.data.url;

      await WebBrowser.openAuthSessionAsync(authUrl, 'plenna://oauth-success');
    } catch (error) {
      logApiErrors(error, 'Erro ao vincular e-mail ao Google');
    }
  }

  return (
    <View style={styles.container}>
      {step === 1 && (
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text style={styles.titulo}>Cadastre-se!</Text>
          <CustomTextInput
            placeholder="Como devemos te chamar?"
            value={nome}
            onChangeText={(text) => atualizarCampo(setNome, 'nome', text)}
            errorMessage={nomeErro}
            isValid={stepOneTouched.nome && nomeValido}
          />
          <CustomTextInput
            placeholder="E-mail"
            value={email}
            onChangeText={(text) => atualizarCampo(setEmail, 'email', text)}
            errorMessage={emailErro}
            isValid={stepOneTouched.email && emailValido}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ width: '100%' }}>
            <CustomTextInput
              placeholder="Senha"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={(text) => atualizarCampo(setSenha, 'senha', text)}
              errorMessage={senhaErro}
              isValid={stepOneTouched.senha && senhaValida}
              styleValidIcon={{ marginRight: 28 }}
              autoCapitalize="none"
            />
            <TouchableOpacity style={{ position: 'absolute', right: 10, top: 8 }} onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={24} color={COLORS.loginLinks} />
            </TouchableOpacity>
          </View>
          <View style={{ width: '100%' }}>
            <CustomTextInput
              placeholder="Confirmação da senha"
              secureTextEntry={!mostrarSenha}
              value={confirmacaoSenha}
              onChangeText={(text) => atualizarCampo(setConfirmacaoSenha, 'confirmacaoSenha', text)}
              errorMessage={confirmacaoSenhaErro}
              isValid={stepOneTouched.confirmacaoSenha && confirmacaoSenhaValida}
              styleValidIcon={{ marginRight: 28 }}
              autoCapitalize="none"
            />
            <TouchableOpacity style={{ position: 'absolute', right: 10, top: 8 }} onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={24} color={COLORS.loginLinks} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setCheckboxAutorizacao(!checkboxAutorizacao)} activeOpacity={0.7}>
            <View style={[styles.checkbox, checkboxAutorizacao && styles.checkboxChecked]}>{checkboxAutorizacao && <Text style={styles.checkboxMark}>✓</Text>}</View>
            <Text style={styles.checkboxText}>Autorizo vincular meu e-mail ao Plenna</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setCheckboxTermos(!checkboxTermos)} activeOpacity={0.7}>
            <View style={[styles.checkbox, checkboxTermos && styles.checkboxChecked]}>{checkboxTermos && <Text style={styles.checkboxMark}>✓</Text>}</View>
            <Text style={styles.checkboxText}>
              Li e concordo com os <Text style={styles.checkboxLink}>termos</Text>{' '}
            </Text>
          </TouchableOpacity>
          <CustomButton title="Cadastrar" style={styles.button} onPress={CadastrarUsuario} />
        </KeyboardAvoidingView>
      )}
      {step === 2 && (
        <View style={{ width: '100%', flex: 1 }}>
          <PreferencesForm
            quantidadeComprasMes={quantidadeComprasMes}
            onQuantidadeComprasChange={setQuantidadeComprasMes}
            valorMaximoCompra={valorMaximoCompra}
            onValorMaximoCompraChange={setValorMaximoCompra}
            limiteGastoValor={limiteGastoValor}
            onLimiteGastoChange={setLimiteGastoValor}
            limiteTempo={limiteTempo.current}
            onLimiteTempoChange={(valor) => {
              limiteTempo.current = valor;
            }}
            selectedCategories={selectedCategories}
            onRemoverCategoria={removerCategoria}
            onAdicionarCategoria={selecionarCategoria}
            onAtualizarLimiteCategoria={atualizarLimiteCategoria}
            onSalvar={AtualizarUsuario}
            isEditing={false}
            obterSomaLimitesCategorias={obterSomaLimitesCategorias}
          />
        </View>
      )}
    </View>
  );
}
