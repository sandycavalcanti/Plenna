import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { styles } from './styles';
import { ActivityIndicator, Alert, BackHandler, FlatList, Modal, Pressable, Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import { CatchError, URL_API } from '../../api/constants';
import { COLORS } from '../../constants';
import { apiClient } from '../../api/client';
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

  function abrirTelinhaCategorias() {
    setCategoryModalVisible(true);
    listarCategorias();
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
      await axios.get(URL_API + '/users/email/' + email.trim());
      Alert.alert('E-mail já cadastrado', 'Use outro e-mail.');
      return;
    } catch (error) {
      CatchError(error);
    }

    try {
      const registerPayload = {
        nome: nome.trim(),
        email: email.trim(),
        senha,
      };
      await axios.post(URL_API + '/auth/register', registerPayload);
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
      CatchError(error);
    }
  }

  function listarCategorias() {
    setCategoriesLoading(true);
    axios
      .get(URL_API + '/categories')
      .then((response) => {
        setCategories(response.data);
      })
      .catch(CatchError)
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
          const somenteDigitos = String(valorMaximoCompra).replace(/\D/g, '');
          if (somenteDigitos) {
            payload.metaValorCompra = Number(somenteDigitos) / 100;
          }
        }

        // Enviar apenas se houver algo para atualizar
        if (Object.keys(payload).length > 0) {
          await apiClient.put('/users', payload);
        }
      } catch (error) {
        // Não bloquear o fluxo principal por erro aqui, mas logar o erro
        CatchError(error);
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
      CatchError(error);
    }
  }

  async function vincularEmailGoogle() {
    try {
      const response = await apiClient.get('/email/connect');
      const authUrl = response.data.url;

      await WebBrowser.openAuthSessionAsync(authUrl, 'plenna://oauth-success');
    } catch (error) {
      CatchError(error);
    }
  }

  function atualizarLimiteMensal(valor) {
    setStepTwoTouched(true);
    setLimiteGastoValor(valor);
  }

  function atualizarQuantidadeComprasMes(valor) {
    const somenteDigitos = valor.replace(/\D/g, '');
    setQuantidadeComprasMes(somenteDigitos);
  }

  function atualizarValorMaximoCompra(valor) {
    const somenteDigitos = valor.replace(/\D/g, '');

    if (!somenteDigitos) {
      setValorMaximoCompra('');
      return;
    }

    const preenchido = somenteDigitos.padStart(3, '0');
    const centavos = preenchido.slice(-2);
    const reaisNumero = Number(preenchido.slice(0, -2) || '0');
    const reais = new Intl.NumberFormat('pt-BR').format(reaisNumero);

    setValorMaximoCompra(`R$ ${reais},${centavos}`);
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
          <CustomTextInput
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onChangeText={(text) => atualizarCampo(setSenha, 'senha', text)}
            errorMessage={senhaErro}
            isValid={stepOneTouched.senha && senhaValida}
            autoCapitalize="none"
          />
          <CustomTextInput
            placeholder="Confirmação da senha"
            secureTextEntry
            value={confirmacaoSenha}
            onChangeText={(text) => atualizarCampo(setConfirmacaoSenha, 'confirmacaoSenha', text)}
            errorMessage={confirmacaoSenhaErro}
            isValid={stepOneTouched.confirmacaoSenha && confirmacaoSenhaValida}
            autoCapitalize="none"
          />
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
          <CustomButton title="seguir" style={styles.button} onPress={() => setStep(2)} />
        </KeyboardAvoidingView>
      )}
      {step === 2 && (
        <ScrollView style={{ width: '95%' }} contentContainerStyle={styles.stepTwoContainer}>
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text style={styles.titulo}>Preferências</Text>
          <View style={styles.borderOverlay}>
            <View style={styles.stepTwoExtraFields}>
              <View style={styles.stepTwoFieldCard}>
                <Text style={styles.stepTwoFieldLabel}>Quantidade de compras por mês</Text>
                <TextInput style={styles.stepTwoFieldInput} value={quantidadeComprasMes} onChangeText={atualizarQuantidadeComprasMes} placeholder="Ex.: 8" keyboardType="numeric" maxLength={3} />
              </View>

              <View style={styles.stepTwoFieldCard}>
                <Text style={styles.stepTwoFieldLabel}>Maior valor em uma única compra</Text>
                <TextInput style={styles.stepTwoFieldInput} value={valorMaximoCompra} onChangeText={atualizarValorMaximoCompra} placeholder="R$ 0,00" keyboardType="numeric" maxLength={15} />
              </View>
            </View>

            <LimitSlider title="Limite mensal de gasto" min={0} max={3000} step={10} valor compact value={limiteGastoValor} onValueChange={atualizarLimiteMensal} textValue={limiteGasto} />
            <Text style={styles.stepTwoHelperText}>Escolha um teto mensal confortável para comprar sem pesar no bolso.</Text>
            <LimitSlider title="Limite de tempo em e-commerces" min={0} max={360} step={10} initialValue={90} horas compact textValue={limiteTempo} />
            <Text style={styles.stepTwoHelperText}>Defina um tempo diário saudável para navegar em sites de compras.</Text>
          </View>
          {mostrarErroStepTwo && <Text style={styles.stepTwoErrorText}>{stepTwoErro}</Text>}
          <TouchableOpacity activeOpacity={0.8} style={styles.segmentAction} onPress={abrirTelinhaCategorias}>
            <Text style={styles.segmentActionText}>Adicionar limites por segmento +</Text>
          </TouchableOpacity>
          <Modal transparent visible={categoryModalVisible} animationType="fade" onRequestClose={fecharTelinhaCategorias}>
            <Pressable style={styles.pressableFecharModal} onPress={fecharTelinhaCategorias}>
              <Pressable style={styles.modalContainer} onPress={(event) => event.stopPropagation()}>
                <Text style={styles.questionTitle}>Selecione a categoria que deseja adicionar</Text>
                <Text style={styles.questionSubtitle}>Toque em uma categoria para definir um limite mensal específico para esse segmento.</Text>

                {categoriesLoading ? (
                  <View style={styles.viewModalCarregando}>
                    <ActivityIndicator size="small" color={COLORS.cadModalCarregando} />
                  </View>
                ) : (
                  <FlatList
                    data={categories}
                    keyExtractor={(item) => String(item.categoria_id)}
                    renderItem={({ item }) => (
                      <TouchableOpacity activeOpacity={0.85} onPress={() => selecionarCategoria(item)} style={styles.categoriaNomeTouchable}>
                        <Text style={styles.categoriaNome}>{item.categoria_nome}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.avisoNenhumaCategoria}>Nenhuma categoria encontrada. Tente atualizar novamente mais tarde.</Text>}
                  />
                )}

                <TouchableOpacity activeOpacity={0.85} onPress={fecharTelinhaCategorias} style={styles.textoFecharModalTouchable}>
                  <Text style={styles.textoFecharModal}>Fechar</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
          {selectedCategories.map((category) => (
            <ProfileCard key={category.categoria_id} title={category.categoria_nome} onRemove={() => removerCategoria(category.categoria_id)} style={{ width: '95%' }}>
              <LimitSlider
                title="Limite mensal"
                min={0}
                max={1000}
                step={10}
                valor
                compact
                value={category.limite}
                onValueChange={(novoValor) => atualizarLimiteCategoria(category.categoria_id, novoValor)}
              />
            </ProfileCard>
          ))}

          <CustomButton title="Finalizar" style={styles.button} onPress={AtualizarUsuario} />
        </ScrollView>
      )}
    </View>
  );
}
