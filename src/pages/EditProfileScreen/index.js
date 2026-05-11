import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, ActivityIndicator, TextInput, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './styles';
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import { COLORS } from '../../constants';

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

  if (texto.includes('T') || texto.includes('-')) {
    const dataBase = texto.split('T')[0];
    const partes = dataBase.split('-');

    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}${mes}${ano}`.slice(0, 8);
    }
  }

  return extrairDigitosDaData(texto);
}

function dataBRParaBanco(digitos) {
  const numeros = manterSomenteDigitos(digitos).slice(0, 8);

  if (numeros.length !== 8) {
    return null;
  }

  const dia = Number(numeros.slice(0, 2));
  const mes = Number(numeros.slice(2, 4));
  const ano = Number(numeros.slice(4, 8));

  if (!dia || !mes || !ano) {
    return null;
  }

  const data = new Date(ano, mes - 1, dia);

  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }

  return new Date(Date.UTC(ano, mes - 1, dia)).toISOString();
}

function formatarValorMoedaParaTela(valor) {
  const numero = parseFloat(
    String(valor ?? '')
      .replace(/[^0-9,.-]/g, '')
      .replace(',', '.'),
  );

  if (!Number.isFinite(numero)) {
    return '';
  }

  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)}`;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || 'info';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    limiteCompra: '',
    metaValorCompra: '',
    metaTempo: '',
    gatilhoConsumo: '',
    tempoTela: '',
    incomodoConsumo: '',
  });
  const [metas, setMetas] = useState([]);
  const [removedGoalIds, setRemovedGoalIds] = useState([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const respUser = await apiClient.get('/users/user');
      const dados = respUser.data || {};
      setUser({
        nome: dados.usuario_nome || '',
        email: dados.usuario_email || '',
        telefone: dados.usuario_telefone || '',
        dataNascimento: dataBancoParaEntrada(dados.usuario_data_nascimento || ''),
        limiteCompra: dados.usuario_limite_compra || '',
        metaValorCompra: dados.usuario_meta_valor_compra || '',
        metaTempo: dados.usuario_meta_tempo || '',
        gatilhoConsumo: dados.usuario_gatilho_consumo || '',
        tempoTela: dados.usuario_tempo_tela || '',
        incomodoConsumo: dados.usuario_incomodo_consumo || '',
      });

      const respGoals = await apiClient.get('/goals');
      const goals = Array.isArray(respGoals.data) ? respGoals.data : [];
      setMetas(goals);
      setRemovedGoalIds([]);
    } catch (error) {
      CatchError(error);
    } finally {
      setLoading(false);
    }
  }

  async function salvarInfo() {
    setSaving(true);
    try {
      // prepara payload com conversão de números quando informados
      const payload = {};
      if (user.nome !== undefined) payload.nome = user.nome;
      if (user.telefone !== undefined) payload.telefone = user.telefone;
      if (user.dataNascimento !== undefined && String(user.dataNascimento).trim() !== '') {
        const dataNascimentoBanco = dataBRParaBanco(user.dataNascimento);

        if (!dataNascimentoBanco) {
          Alert.alert('Data inválida', 'Digite uma data de nascimento válida no formato DD/MM/AAAA.');
          setSaving(false);
          return;
        }

        payload.dataNascimento = dataNascimentoBanco;
      }
      if (user.limiteCompra !== undefined && String(user.limiteCompra).trim() !== '') payload.limiteCompra = parseNumber(String(user.limiteCompra));
      if (user.metaValorCompra !== undefined && String(user.metaValorCompra).trim() !== '') payload.metaValorCompra = parseNumber(String(user.metaValorCompra));
      if (user.metaTempo !== undefined && String(user.metaTempo).trim() !== '') payload.metaTempo = Number(user.metaTempo);
      if (user.gatilhoConsumo !== undefined) payload.gatilhoConsumo = user.gatilhoConsumo;
      if (user.tempoTela !== undefined) payload.tempoTela = user.tempoTela;
      if (user.incomodoConsumo !== undefined) payload.incomodoConsumo = user.incomodoConsumo;

      await apiClient.put('/users', payload);
      Alert.alert('Sucesso', 'Informações atualizadas.');
      navigation.goBack();
    } catch (error) {
      CatchError(error);
    } finally {
      setSaving(false);
    }
  }

  async function salvarMetas() {
    setSaving(true);
    try {
      const metasOriginais = [...metas];

      // Valida e converte valores antes de enviar
      for (const m of metasOriginais) {
        const titulo = (m.meta_titulo || '').trim();
        if (!titulo) {
          Alert.alert('Campo obrigatório', 'Todas as metas precisam de um título.');
          setSaving(false);
          return;
        }

        const rawValor = String(m.meta_valor || '').trim();
        const valor = parseNumber(rawValor);
        if (isNaN(valor)) {
          Alert.alert('Valor inválido', 'Preencha um valor numérico válido para todas as metas.');
          setSaving(false);
          return;
        }

        if (m.meta_id) {
          await apiClient.put(`/goals/${m.meta_id}`, {
            titulo: titulo,
            descricao: m.meta_descricao || '',
            valor: valor,
          });
        } else {
          await apiClient.post('/goals', {
            titulo: titulo,
            descricao: m.meta_descricao || '',
            valor: valor,
          });
        }
      }

      for (const goalId of removedGoalIds) {
        await apiClient.delete(`/goals/${goalId}`);
      }

      Alert.alert('Sucesso', 'Metas atualizadas.');
      navigation.goBack();
    } catch (error) {
      CatchError(error);
    } finally {
      setSaving(false);
    }
  }

  function atualizarMeta(index, campo, valor) {
    setMetas((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  }

  function adicionarMeta() {
    setMetas((prev) => [...prev, { meta_titulo: '', meta_descricao: '', meta_valor: '' }]);
  }

  function removerMeta(index) {
    setMetas((prev) => {
      const meta = prev[index];

      if (meta?.meta_id) {
        setRemovedGoalIds((current) => (current.includes(meta.meta_id) ? current : [...current, meta.meta_id]));
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function parseNumber(raw) {
    if (raw === undefined || raw === null) return NaN;
    let s = String(raw).trim();
    // remove currency symbols and spaces
    s = s.replace(/[^0-9,.-]/g, '');
    // convert comma to dot if comma used as decimal separator
    const commaCount = (s.match(/,/g) || []).length;
    if (commaCount > 0 && s.indexOf('.') === -1) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
  }

  if (loading)
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
      </View>
    );

  function renderTextField(label, value, onChangeText, placeholder, extraProps = {}) {
    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <CustomTextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={styles.inputWrapper} {...extraProps} />
      </View>
    );
  }

  function renderOptionGroup(title, options, selectedValue, onSelect) {
    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>{title}</Text>
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
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heroCard}>
        <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.heroLogo} />
        <Text style={styles.heroTitle}>{mode === 'goals' ? 'Editar Metas' : 'Editar Informações'}</Text>
        <Text style={styles.heroSubtitle}>{mode === 'goals' ? 'Gerencie suas metas financeiras — adicione, edite ou remova.' : 'Gerencie suas informações pessoais — adicione, edite ou remova.'}</Text>
      </View>

      {mode === 'info' ? (
        <View style={styles.sectionsWrap}>
          <ProfileCard title="Dados básicos" style={styles.sectionCard}>
            {renderTextField('Nome', user.nome, (t) => setUser((u) => ({ ...u, nome: t })), 'Nome')}
            {renderTextField('E-mail', user.email, (t) => setUser((u) => ({ ...u, email: t })), 'E-mail', { keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderTextField('Telefone', formatarTelefoneParaTela(user.telefone), (t) => setUser((u) => ({ ...u, telefone: manterSomenteDigitos(t).slice(0, 11) })), '(00) 00000-0000', {
              keyboardType: 'phone-pad',
              maxLength: 15,
            })}
            {renderTextField('Data de nascimento', formatarDataParaTela(user.dataNascimento), (t) => setUser((u) => ({ ...u, dataNascimento: extrairDigitosDaData(t) })), 'DD/MM/AAAA', {
              keyboardType: 'numeric',
              maxLength: 10,
            })}
          </ProfileCard>

          <ProfileCard title="Hábitos digitais" style={styles.sectionCard}>
            {renderOptionGroup('O que mais te incomoda no seu consumo digital?', discomfortOptions, user.incomodoConsumo, (option) => setUser((u) => ({ ...u, incomodoConsumo: option })))}
            {renderOptionGroup('Quanto tempo voce acha que passa no celular?', screenTimeOptions, user.tempoTela, (option) => setUser((u) => ({ ...u, tempoTela: option })))}
            {renderOptionGroup('O que mais te faz comprar ou consumir algo?', triggerOptions, user.gatilhoConsumo, (option) => setUser((u) => ({ ...u, gatilhoConsumo: option })))}
          </ProfileCard>
          <View style={styles.actionsRow}>
            <CustomButton title={saving ? 'Salvando...' : 'Salvar'} onPress={salvarInfo} style={styles.saveButton} />
          </View>
        </View>
      ) : (
        <View style={styles.sectionsWrap}>
          <TouchableOpacity activeOpacity={0.85} onPress={adicionarMeta} style={styles.addGoalAction}>
            <Text style={styles.addGoalActionText}>Adicionar meta</Text>
          </TouchableOpacity>

          {metas.map((m, idx) => (
            <ProfileCard key={m.meta_id || `goal-${idx}`} title={m.meta_titulo || 'Nova meta'} onRemove={() => removerMeta(idx)} style={styles.goalEditorCard}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Título</Text>
                <CustomTextInput placeholder="Título" value={m.meta_titulo} onChangeText={(t) => atualizarMeta(idx, 'meta_titulo', t)} style={styles.inputWrapper} />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  placeholder="Descrição"
                  value={m.meta_descricao || ''}
                  onChangeText={(t) => atualizarMeta(idx, 'meta_descricao', t)}
                  style={styles.goalDescriptionInput}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Valor</Text>
                <CustomTextInput
                  placeholder="R$ 0,00"
                  value={formatarValorMoedaParaTela(m.meta_valor)}
                  onChangeText={(t) => atualizarMeta(idx, 'meta_valor', String(t).replace(/[^0-9,.-]/g, ''))}
                  keyboardType="numeric"
                  style={styles.inputWrapper}
                />
              </View>
            </ProfileCard>
          ))}

          <View style={styles.actionsRow}>
            <CustomButton title={saving ? 'Salvando...' : 'Salvar Metas'} onPress={salvarMetas} style={styles.saveButton} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
