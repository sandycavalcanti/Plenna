import { categoriaEhOutros } from '../../utils/categorias';
import React, { useEffect, useState, useRef } from 'react';
import { styles } from './styles';
import { ActivityIndicator, Alert, BackHandler, FlatList, Modal, Platform, Pressable, Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import PreferencesForm from '../../components/PreferencesForm';
import { valorMonetarioParaNumero } from '../../components/CustomTextInput/currency';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants';
import { apiClient } from '../../api/client';
import { distribuirSobraEmOutros, obterIdCategoriaOutros, validarCatalogoCategorias } from '../../utils/categorias';
import { calcularOrcamento } from '../../utils/orcamento';
import { registrarFalhaPreferencias, mensagemValidacaoPreferencias } from '../../utils/preferenciasDiagnostico';
import { Ionicons } from '@expo/vector-icons';
import { invalidateProtectedSession } from '../../services/security/protectedSession';
import { tokenStorage } from '../../api/tokenStorage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();
const signupKeyboardBehavior = typeof Platform !== 'undefined' && Platform.OS === 'android' ? 'height' : 'padding';
const discomfortOptions = ['Uso excessivo do celular', 'Compras por impulso', 'Falta de controle', 'Quero entender meus habitos', 'So curiosidade'];

const screenTimeOptions = ['Pouco (ate 2h)', 'Moderado (2-5h)', 'Alto (5-8h)', 'Muito alto (+8h)'];

const triggerOptions = ['Promocao relampago', 'Anuncios', 'Influencia de pessoas', 'Tedio', 'Ansiedade', 'Nao sei'];

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

export default function SignUpScreen({ navigation, route }) {
  const completandoOnboarding = route?.params?.completarOnboarding === true;
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
  const [categoriesError, setCategoriesError] = useState('');
  const catalogRequest = useRef(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [limiteGastoValor, setLimiteGastoValor] = useState(290);
  const limiteGastoReferencia = useRef(290);
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
    if (step === 2 && categories.length === 0) listarCategorias();
  }, [step]);

  useEffect(() => {
    if (step !== 2) {
      return undefined;
    }

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (completandoOnboarding) {
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
    return categorias
      .filter((categoria) => !categoriaEhOutros(categoria))
      .reduce((total, categoria) => total + Math.round((Number(categoria.limite) || 0) * 100), 0) / 100;
  }

  function atualizarLimiteMensal(valor, metaBloqueada = false) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
      return;
    }

    // Somente uma escolha manual substitui a referencia do orcamento.
    limiteGastoReferencia.current = numero;
    setLimiteGastoValor(metaBloqueada
      ? numero
      : Math.max(numero, obterSomaLimitesCategorias(selectedCategories)));
  }

  function ajustarLimiteGastoParaCategorias(categorias) {
    const somaCategorias = obterSomaLimitesCategorias(categorias);
    setLimiteGastoValor(Math.max(limiteGastoReferencia.current, somaCategorias));
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


      return nextCategories;
    });

    fecharTelinhaCategorias();
  }

  function atualizarLimiteCategoria(categoriaId, novoValor, metaBloqueada) {
    const categoriaAtual = selectedCategories.find(
      (item) => item.categoria_id === categoriaId
    );

    if (!categoriaAtual || categoriaEhOutros(categoriaAtual)) {
      return;
    }

    const valorAnterior = Number(categoriaAtual.limite) || 0;
    const valorSolicitado = Number(novoValor);

    if (!Number.isFinite(valorSolicitado) || valorSolicitado < 0) {
      return;
    }

    const somaOutrasCategorias = obterSomaLimitesCategorias(
      selectedCategories.filter(
        (item) => item.categoria_id !== categoriaId
      )
    );

    const valorNovo = metaBloqueada && valorSolicitado > valorAnterior
      ? Math.min(
          valorSolicitado,
          Math.max(
            valorAnterior,
            Math.round((Number(limiteGastoValor) - somaOutrasCategorias) * 100) / 100
          )
        )
      : valorSolicitado;

    const proximasCategorias = selectedCategories.map((item) =>
      item.categoria_id === categoriaId
        ? { ...item, limite: valorNovo }
        : item
    );

    if (!metaBloqueada) {
      ajustarLimiteGastoParaCategorias(proximasCategorias);
    }

    setSelectedCategories(proximasCategorias);
  }

  function removerCategoria(categoriaId, metaBloqueada = false) {
    setStepTwoTouched(true);

    const nextCategories = selectedCategories.filter((item) => item.categoria_id !== categoriaId);
    if (!metaBloqueada) {
      ajustarLimiteGastoParaCategorias(nextCategories);
    }
    setSelectedCategories(nextCategories);
  }
async function CadastrarUsuario() {
  let etapaCadastro = 'VALIDACAO';
  try {
    setStepOneAttempted(true);

    if (stepOneInvalido) {
      Alert.alert('Campos inválidos', 'Confira os campos em vermelho.');
      return;
    }

    // A API valida unicidade no cadastro, sem endpoint de enumeracao.

   const registerPayload = {
      nome: nome.trim(),
      email: email.trim(),
      senha,
      aceitouTermos: checkboxTermos,
    };

    etapaCadastro = 'CADASTRO_USUARIO';
    await apiClient.post('/auth/register', registerPayload);

    etapaCadastro = 'LOGIN';
    const loginResponse = await apiClient.post('/auth/login', {
      email: email.trim(),
      senha,
    });

    etapaCadastro = 'SESSAO';
    await tokenStorage.setToken(loginResponse.data.token);
    // O cadastro também inicia uma nova sessão de usuário e não pode herdar
    // uma área de compras desbloqueada anteriormente neste processo.
    invalidateProtectedSession();

    if (checkboxAutorizacao) {
      await vincularEmailGoogle();
    } else {
      setStep(2);
    }
  } catch (error) {
    registrarFalhaPreferencias(error, etapaCadastro, 'CADASTRO');
  }
}
  function listarCategorias() {
    if (catalogRequest.current) return catalogRequest.current;
    setCategoriesLoading(true);
    setCategoriesError('');
    catalogRequest.current = apiClient
      .get('/categories')
      .then((response) => {
        setCategories(validarCatalogoCategorias(response.data));
      })
      .catch((error) => {
        setCategories([]);
        setCategoriesError('Não foi possível carregar um catálogo válido de categorias. Tente novamente.');
        registrarFalhaPreferencias(error, 'CATALOGO', 'CADASTRO');
      })
      .finally(() => {
        catalogRequest.current = null;
        setCategoriesLoading(false);
      });
    return catalogRequest.current;
  }

  async function AtualizarUsuario(metaBloqueada = false) {
    let etapaSalvamento = 'VALIDACAO';
    try {
      setStepTwoAttempted(true);
      if (metaBloqueada && stepTwoInvalido) {
        Alert.alert('Limites inválidos', 'A soma dos limites por categoria não pode ultrapassar o limite mensal de gasto.');
        return;
      }
      if (categoriesLoading || categoriesError) {
        throw Object.assign(new Error('Catálogo indisponível.'), { code: 'CATALOGO_INVALIDO' });
      }
      validarCatalogoCategorias(categories, selectedCategories);
      const idOutros = obterIdCategoriaOutros(categories);

      const resultadoOrcamento = calcularOrcamento({
        limiteMensal: Number(limiteGastoValor),
        valorMaximoCompra: valorMaximoCompra === '' || valorMaximoCompra == null ? 0 : Number(valorMaximoCompra),
        categorias: selectedCategories,
        metaBloqueada,
        idCategoriaOutros: idOutros,
      });

      const limiteMensal = resultadoOrcamento.tetoMensal;

      if (limiteMensal <= 0) {
        throw new Error('Informe um orçamento mensal maior que zero.');
      }

      const categoriasBase = distribuirSobraEmOutros(
        resultadoOrcamento.categoriasValidas,
        categories,
        resultadoOrcamento.sobraParaOutros
      );

      if (
        categoriasBase.length === 0 ||
        categoriasBase.some((categoria) => categoria.limite <= 0)
      ) {
        throw new Error('Defina preferências válidas antes de salvar.');
      }
      // Atualizar as metas do usuário antes das preferências por categoria.
      // Se esta requisição falhar, interromper o fluxo.
      const payload = {};

      if (quantidadeComprasMes) {
        const num = Number(quantidadeComprasMes.replace(/\D/g, ''));
        if (!Number.isNaN(num)) payload.limiteCompra = num;
      }

      payload.metaValorMensal = limiteMensal;

      if (valorMaximoCompra !== '' && valorMaximoCompra !== null) {
        const valorAtencao = Number(valorMaximoCompra);
        if (Number.isFinite(valorAtencao) && valorAtencao > 0) {
          payload.metaValorCompra = valorAtencao;
        }
      }

      if (limiteTempo.current !== undefined && limiteTempo.current !== null) {
        payload.metaTempo = Number(limiteTempo.current);
      }

      etapaSalvamento = 'USUARIO';
      await apiClient.put('/users', payload);
      // Em seguida, persistir preferências por categoria (substitui existentes para evitar duplicação)
      etapaSalvamento = 'PREFERENCIAS';
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
      registrarFalhaPreferencias(error, etapaSalvamento, 'CADASTRO');

      if (etapaSalvamento === 'PREFERENCIAS') {
        Alert.alert(
          'Salvamento incompleto',
          'As metas do usuário podem ter sido atualizadas, mas não foi possível salvar as preferências por categoria. Confira os dados antes de tentar novamente.'
        );
      } else if (etapaSalvamento === 'USUARIO') {
        Alert.alert(
          'Não foi possível concluir',
          'Não foi possível confirmar a atualização das metas. Confira os dados antes de tentar novamente.'
        );
      } else {
        Alert.alert(
          'Confira suas preferências',
          mensagemValidacaoPreferencias(error)
        );
      }
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
  <SafeAreaView style={{ flex: 1 }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={signupKeyboardBehavior}
      keyboardVerticalOffset={0}
    >
     {step === 1 && (
  <ScrollView
    style={styles.signupScroll}
    contentContainerStyle={styles.signupScrollContent}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    showsVerticalScrollIndicator={false}
  >
    <View style={styles.overlay}>
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text
            style={styles.titulo}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Cadastre-se!
          </Text>

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
            <Text style={styles.checkboxText}>Autorizo vincular meu e-mail ao Plenna</Text>
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

         <CustomButton title="Cadastrar" style={styles.button} onPress={CadastrarUsuario} />
    </View>
  </ScrollView>
)}

      {step === 2 && (
        <ScrollView
          style={styles.containerScroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <PreferencesForm
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            onRecarregarCategorias={listarCategorias}
            quantidadeComprasMes={quantidadeComprasMes}
            onQuantidadeComprasChange={setQuantidadeComprasMes}
            valorMaximoCompra={valorMaximoCompra}
            onValorMaximoCompraChange={(valor) => {
              setValorMaximoCompra(valor);
            }}
            limiteGastoValor={limiteGastoValor}
            onLimiteGastoChange={atualizarLimiteMensal}
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
