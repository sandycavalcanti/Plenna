import React, { useState, useRef } from 'react';
import axios from 'axios';
import { styles } from './styles';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import LimitSlider from '../../components/LimitSlider';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import { CatchError, URL_API } from '../../api/constants';
import { COLORS } from '../../constants';

const discomfortOptions = ['Uso excessivo do celular', 'Compras por impulso', 'Falta de controle', 'Quero entender meus habitos', 'So curiosidade'];

const screenTimeOptions = ['Pouco (ate 2h)', 'Moderado (2-5h)', 'Alto (5-8h)', 'Muito alto (+8h)'];

const triggerOptions = ['Promocao relampago', 'Anuncios', 'Influencia de pessoas', 'Tedio', 'Ansiedade', 'Nao sei'];

export default function SignUpScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [digitalDiscomfort, setDigitalDiscomfort] = useState('');
  const [screenTime, setScreenTime] = useState('');
  const [consumptionTrigger, setConsumptionTrigger] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const nome = useRef('');
  const email = useRef('');
  const senha = useRef('');
  const confirmacaoSenha = useRef('');
  const limiteGasto = useRef(0);
  const limiteTempo = useRef(0);

  function abrirTelinhaCategorias() {
    setCategoryModalVisible(true);
    listarCategorias();
  }

  function fecharTelinhaCategorias() {
    setCategoryModalVisible(false);
  }

  function selecionarCategoria(category) {
    setSelectedCategories((prevCategories) => {
      const exists = prevCategories.some((item) => item.categoria_id === category.categoria_id);

      if (exists) {
        return prevCategories;
      }

      return [
        ...prevCategories,
        {
          ...category,
          limite: 0,
        },
      ];
    });

    fecharTelinhaCategorias();
  }

  function atualizarLimiteCategoria(categoriaId, novoValor) {
    setSelectedCategories((prevCategories) =>
      prevCategories.map((item) =>
        item.categoria_id === categoriaId
          ? {
              ...item,
              limite: novoValor,
            }
          : item,
      ),
    );
  }

  async function Cadastrar() {
    await axios
      .post(URL_API + '/auth/register', {
        nome: nome.current,
        email: email.current,
        senha: senha.current,
        preferenciasMetaValor: limiteGasto.current,
        preferenciasMetaTempo: limiteTempo.current,
      })
      .then((response) => {
        setStep(3);
      })
      .catch(CatchError);
  }

  function Verificar() {
    axios
      .get(URL_API + '/users/email/' + email.current)
      .then(async (response) => {
        const dados = response.data;
        console.log('Ja existe um usuario com esse email');
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />

      {step === 1 && (
        <View style={styles.overlay}>
          <CustomTextInput placeholder="Como devemos te chamar?" textValue={nome} />
          <CustomTextInput placeholder="E-mail" secureTextEntry textValue={email} />
          <CustomTextInput placeholder="Senha" secureTextEntry textValue={senha} />
          <CustomTextInput placeholder="Confirmação da senha" secureTextEntry textValue={confirmacaoSenha} />
          <CustomButton title="Cadastrar" style={styles.button} onPress={Verificar} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepTwoContainer}>
          <Text style={styles.titulo}>Preferências</Text>
          <View style={styles.borderOverlay}>
            <LimitSlider title="Limite mensal de gasto" min={0} max={2000} step={10} initialValue={290} valor compact textValue={limiteGasto} />
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
                max={2000}
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

          <CustomButton title="Finalizar" style={styles.button} onPress={Cadastrar} />
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepThreeContainer}>
          <Text style={styles.stepThreeTitle}>Questionario</Text>

          <ScrollView style={styles.stepThreeScroll} contentContainerStyle={styles.stepThreeContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.questionBlock}>
              <Text style={styles.questionTitle}>Telefone</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" style={styles.stepThreeInput} />
            </View>

            <View style={styles.questionBlock}>
              <Text style={styles.questionTitle}>Data de nascimento</Text>
              <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="DD/MM/AAAA" keyboardType="numeric" style={styles.stepThreeInput} />
            </View>

            {renderOptionGroup('O que mais te incomoda no seu consumo digital?', discomfortOptions, digitalDiscomfort, setDigitalDiscomfort)}

            {renderOptionGroup('Quanto tempo voce acha que passa no celular?', screenTimeOptions, screenTime, setScreenTime)}

            {renderOptionGroup('O que mais te faz comprar ou consumir algo?', triggerOptions, consumptionTrigger, setConsumptionTrigger)}

            <CustomButton title="Concluir cadastro" style={styles.stepThreeButton} onPress={() => navigation.navigate('App')} />
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
