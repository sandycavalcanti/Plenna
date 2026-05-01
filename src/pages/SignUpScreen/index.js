import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { styles } from './styles';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import { CatchError, URL_API } from '../../api/constants';
import { COLORS } from '../../constants';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';

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

  useEffect(() => {
    limiteGasto.current = limiteGastoValor;
  }, [limiteGastoValor]);

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

  async function CadastrarUsuario() {
    try {
      await axios.post(URL_API + '/auth/register', {
        nome: nome.trim(),
        email: email.trim(),
        senha,
        preferenciasMetaValor: limiteGastoValor,
        preferenciasMetaTempo: limiteTempo.current,
      });

      const loginResponse = await apiClient.post('/auth/login', {
        email: email.trim(),
        senha,
      });
      await tokenStorage.setToken(loginResponse.data.token);
      await apiClient.post('/preferencias-categoria/bulk', {
        preferencias: selectedCategories.map((category) => ({
          categoriaId: category.categoria_id,
          metaMensal: category.limite,
        })),
      });
      navigation.navigate('Questionario');
    } catch (error) {
      CatchError(error);
    }
  }

  function Verificar() {
    setStepOneAttempted(true);
    if (stepOneInvalido) {
      Alert.alert('Campos inválidos', 'Confira os campos em vermelho antes de continuar.');
      return;
    }
    axios
      .get(URL_API + '/users/email/' + email.trim())
      .then(async (response) => {
        Alert.alert('E-mail já cadastrado', 'Use outro e-mail para continuar.');
      })
      .catch((error) =>
        CatchError(error, 'Erro ao verificar email: ', () => {
          // Se o erro for 404, significa que o email nao existe e podemos prosseguir com o cadastro
          setStep(2);
        }),
      );
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
          <CustomButton title="Cadastrar" style={styles.button} onPress={Verificar} />
        </KeyboardAvoidingView>
      )}
      {step === 2 && (
        <ScrollView style={{ width: '95%' }} contentContainerStyle={styles.stepTwoContainer}>
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text style={styles.titulo}>Preferências</Text>
          <View style={styles.borderOverlay}>
            <LimitSlider title="Limite mensal de gasto" min={0} max={3000} step={10} valor compact value={limiteGastoValor} onValueChange={setLimiteGastoValor} textValue={limiteGasto} />
            <LimitSlider title="Limite de tempo em e-commerces" min={0} max={360} step={10} initialValue={90} horas compact textValue={limiteTempo} />
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.segmentAction} onPress={abrirTelinhaCategorias}>
            <Text style={styles.segmentActionText}>Adicionar limites por segmento +</Text>
          </TouchableOpacity>
          <Modal transparent visible={categoryModalVisible} animationType="fade" onRequestClose={fecharTelinhaCategorias}>
            <Pressable style={styles.pressableFecharModal} onPress={fecharTelinhaCategorias}>
              <Pressable style={styles.modalContainer} onPress={(event) => event.stopPropagation()}>
                <Text style={styles.questionTitle}>Selecione uma categoria</Text>

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
                    ListEmptyComponent={<Text style={styles.avisoNenhumaCategoria}>Nenhuma categoria encontrada.</Text>}
                  />
                )}

                <TouchableOpacity activeOpacity={0.85} onPress={fecharTelinhaCategorias} style={styles.textoFecharModalTouchable}>
                  <Text style={styles.textoFecharModal}>Fechar</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
          {selectedCategories.map((category) => (
            <ProfileCard key={category.categoria_id} title={category.categoria_nome} style={{ width: '95%' }}>
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
          <CustomButton title="Finalizar" style={styles.button} onPress={CadastrarUsuario} />
        </ScrollView>
      )}
    </View>
  );
}
