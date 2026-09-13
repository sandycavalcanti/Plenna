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
import { conectarEmail, consultarConexaoEmail } from '../../api/email';
import { SafeAreaView } from 'react-native-safe-area-context';

const discomfortOptions = ['Uso excessivo do celular', 'Compras por impulso', 'Falta de controle', 'Quero entender meus habitos', 'So curiosidade'];

const screenTimeOptions = ['Pouco (ate 2h)', 'Moderado (2-5h)', 'Alto (5-8h)', 'Muito alto (+8h)'];

const triggerOptions = ['Promocao relampago', 'Anuncios', 'Influencia de pessoas', 'Tedio', 'Ansiedade', 'Nao sei'];

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

export default function SignUpScreen({ navigation, route }) {
  const completandoOnboarding = route?.params?.completarOnboarding === true;
  const contaCriada = useRef(completandoOnboarding);
  const criandoConta = useRef(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(completandoOnboarding);
  const [step, setStep] = useState(completandoOnboarding ? 2 : 1);
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
    if (step !== 2) {
      return undefined;
    }

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (completandoOnboarding || contaCriada.current) {
        Alert.alert('Preferências obrigatórias', 'Finalize suas preferências para acessar o Plenna.');
        return true;
      }

      setStep(1);
      return true;
    });

    return () => backSubscription.remove();
  }, [completandoOnboarding, step]);

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

  function ajustarLimiteMensalMinimo(valorCompra, categorias) {
  const valorMaximo = valorCompra
    ? valorMonetarioParaNumero(valorCompra)
    : 0;

  const somaCategorias = obterSomaLimitesCategorias(categorias);

  const novoLimite = Math.max(
    Number(limiteGastoValor) || 0,
    valorMaximo,
    somaCategorias
  );

  setLimiteGastoValor(novoLimite);
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

  function atualizarLimiteCategoria(categoriaId, novoValor, metaBloqueada) {
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

      if (!metaBloqueada) {
        ajustarLimiteGastoParaCategorias(nextCategories);
      }

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
  if (criandoConta.current) return;
  setStepOneAttempted(true);
  if (stepOneInvalido || !checkboxTermos) {
    Alert.alert('Confira seus dados', 'Preencha os campos e aceite os termos para continuar.');
    return;
  }
  criandoConta.current = true;
  setCadastrando(true);
  try {
    if (!contaCriada.current) {
      try {
        await apiClient.post('/auth/register', {
          nome: nome.trim(), email: email.trim(), senha, aceitouTermos: true,
        });
        contaCriada.current = true;
      } catch (error) {
        const semResposta = !error.response;
        Alert.alert('Criação não confirmada', semResposta
          ? 'Não foi possível confirmar a criação. Tente entrar para verificar e retomar, antes de cadastrar novamente.'
          : 'Não foi possível criar a conta. Confira os dados ou entre se já possui cadastro.',
          [{ text: 'Fechar' }, { text: 'Entrar', onPress: () => navigation.navigate('Login') }]);
        return;
      }
    }
    try {
      const login = await apiClient.post('/auth/login', { email: email.trim(), senha });
      await tokenStorage.setToken(login.data.token);
      setSessaoPronta(true);
      setStep(2);
      if (checkboxAutorizacao) {
        Alert.alert('Conta criada', 'Você pode concluir suas preferências e conectar o Gmail quando desejar.');
      }
    } catch {
      Alert.alert('Sua conta foi criada', 'Entre para continuar suas preferências. Não é necessário criar outra conta.',
        [{ text: 'Tentar entrar novamente' }, { text: 'Entrar', onPress: () => navigation.navigate('Login') }]);
    }
  } finally {
    criandoConta.current = false;
    setCadastrando(false);
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
    if (criandoConta.current) return;
    criandoConta.current = true;
    setCadastrando(true);
    try {
      const resultado = await conectarEmail();
      Alert.alert(resultado.cancelado ? 'Conexão cancelada' : 'Conexão confirmada',
        'Sua conta está criada. Continue suas preferências ou gerencie o e-mail em Permissões.');
    } catch {
      try {
        const estado = await consultarConexaoEmail();
        Alert.alert('Estado da conexão', estado.conexaoEmail === 'conectado'
          ? 'Gmail conectado. Sua conta foi criada.'
          : 'Sua conta foi criada. A conexão de e-mail pode ser retomada em Permissões.');
      } catch {
        Alert.alert('Sua conta foi criada', 'Não foi possível confirmar a conexão. Atualize em Permissões para verificar o estado.');
      }
    } finally {
      criandoConta.current = false;
      setCadastrando(false);
    }
  }

  return (
  <SafeAreaView style={{ flex: 1 }}>
    {cadastrando && <ActivityIndicator />}
    {sessaoPronta && <CustomButton title="Conectar Gmail (opcional)" onPress={vincularEmailGoogle} disabled={cadastrando} />}
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {step === 1 && (
        <View style={styles.overlay}>
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
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, top: 8 }}
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={COLORS.loginLinks}
              />
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
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, top: 8 }}
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={COLORS.loginLinks}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setCheckboxAutorizacao(!checkboxAutorizacao)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checkboxAutorizacao && styles.checkboxChecked]}>
              {checkboxAutorizacao && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>Quero conectar meu e-mail para importar compras (opcional, confirmado após conectar)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setCheckboxTermos(!checkboxTermos)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checkboxTermos && styles.checkboxChecked]}>
              {checkboxTermos && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              Li e concordo com os <Text style={styles.checkboxLink}>termos</Text>{' '}
            </Text>
          </TouchableOpacity>

          <CustomButton title={contaCriada.current ? "Entrar e continuar" : "Cadastrar"} style={styles.button} onPress={CadastrarUsuario} disabled={cadastrando} />
        </View>
      )}

      {step === 2 && (
        <ScrollView
          style={styles.containerScroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <PreferencesForm
            quantidadeComprasMes={quantidadeComprasMes}
            onQuantidadeComprasChange={setQuantidadeComprasMes}
            valorMaximoCompra={valorMaximoCompra}
            onValorMaximoCompraChange={(valor) => {
              setValorMaximoCompra(valor);
              ajustarLimiteMensalMinimo(valor, selectedCategories);
            }}
            limiteGastoValor={limiteGastoValor}
            onLimiteGastoChange={(valor) => {
              setLimiteGastoValor(valor);
            }}
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
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}
