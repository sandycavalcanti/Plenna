import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, Alert, ActivityIndicator, Image, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';
import AppScreenHeader from '../../components/Common/AppScreenHeader';
import MetaFormSheet from '../../components/Metas/MetaFormSheet';
import { formatarPercentualMeta, formatarValorMeta } from '../../utils/metaMoney';
import { normalizarRespostaMetas } from '../../utils/metaContract';
import { atualizarMeta, criarMeta, excluirMeta } from '../../api/metas';
import { tokenStorage } from '../../api/tokenStorage';

const PENDING_OPERATION_PREFIX = '@plenna/goal-savings/pending/';

function pendingKey(metaId, sessionScope) {
  return `${PENDING_OPERATION_PREFIX}${sessionScope}:${metaId}`;
}

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
    metaTempo: '',
    gatilhoConsumo: '',
    tempoTela: '',
    incomodoConsumo: '',
  });
  const [metas, setMetas] = useState([]);
  const [metaForm, setMetaForm] = useState({ visible: false, mode: 'create', meta: null });
  const [metaFormError, setMetaFormError] = useState(null);
  const [metaFormSaving, setMetaFormSaving] = useState(false);
  const [metaDeleting, setMetaDeleting] = useState(false);
  const [pendingMetaIds, setPendingMetaIds] = useState(() => new Set());
  const [pendingCheckError, setPendingCheckError] = useState(false);

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
        metaTempo: dados.usuario_meta_tempo || '',
        gatilhoConsumo: dados.usuario_gatilho_consumo || '',
        tempoTela: dados.usuario_tempo_tela || '',
        incomodoConsumo: dados.usuario_incomodo_consumo || '',
      });

      await carregarMetas();
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  }

  async function carregarMetas() {
    const respostaMetas = await apiClient.get('/metas');
    const metasApi = normalizarRespostaMetas(respostaMetas.data);
    setMetas(metasApi);
    carregarOperacoesPendentes(metasApi);
    return metasApi;
  }

  async function carregarOperacoesPendentes(metasApi) {
    setPendingCheckError(false);
    try {
      const session = await tokenStorage.captureSession();
      const sessionScope = String(session?.id ?? 'anonymous');
      const keys = metasApi
        .filter((meta) => meta.meta_id)
        .map((meta) => ({ metaId: meta.meta_id, key: pendingKey(meta.meta_id, sessionScope) }));
      const stored = await AsyncStorage.multiGet(keys.map(({ key }) => key));
      const activeIds = new Set();
      stored.forEach(([key, value]) => {
        if (!value) return;
        const match = keys.find((item) => item.key === key);
        if (match) activeIds.add(match.metaId);
      });
      setPendingMetaIds(activeIds);
    } catch {
      setPendingMetaIds(new Set());
      setPendingCheckError(true);
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
      if (user.metaTempo !== undefined && String(user.metaTempo).trim() !== '') payload.metaTempo = Number(user.metaTempo);
      if (user.gatilhoConsumo !== undefined) payload.gatilhoConsumo = user.gatilhoConsumo;
      if (user.tempoTela !== undefined) payload.tempoTela = user.tempoTela;
      if (user.incomodoConsumo !== undefined) payload.incomodoConsumo = user.incomodoConsumo;

      await apiClient.put('/users', payload);
      Alert.alert('Sucesso', 'Informações atualizadas.');
      navigation.goBack();
    } catch (error) {
      logApiErrors(error, 'Erro ao salvar informações do perfil');
    } finally {
      setSaving(false);
    }
  }

  function abrirNovaMeta() {
    setMetaFormError(null);
    setMetaForm({ visible: true, mode: 'create', meta: null });
  }

  function abrirEdicaoMeta(meta) {
    setMetaFormError(null);
    setMetaForm({ visible: true, mode: 'edit', meta });
  }

  async function salvarMetaFormulario(data) {
    setMetaFormSaving(true);
    setMetaFormError(null);
    try {
      if (metaForm.mode === 'edit' && metaForm.meta?.meta_id) {
        await atualizarMeta(metaForm.meta.meta_id, data);
      } else {
        await criarMeta(data);
      }
      await carregarMetas();
      setMetaForm({ visible: false, mode: 'create', meta: null });
      Alert.alert('Sucesso', metaForm.mode === 'edit' ? 'Meta atualizada.' : 'Meta criada.');
    } catch (error) {
      setMetaFormError(error?.response?.data?.message || 'Não foi possível salvar a meta. Confira os dados e tente novamente.');
      logApiErrors(error, 'Erro ao salvar meta');
      throw error;
    } finally {
      setMetaFormSaving(false);
    }
  }

  function confirmarExclusaoMeta(meta) {
    if (!meta?.meta_id) return;
    if (pendingCheckError) {
      Alert.alert('Não foi possível verificar a operação', 'Tente novamente antes de excluir a meta, para preservar qualquer operação pendente.');
      return;
    }
    if (pendingMetaIds.has(meta.meta_id)) {
      Alert.alert('Operação pendente', 'Resolva a operação pendente antes de excluir esta meta.');
      return;
    }
    Alert.alert(
      'Excluir meta?',
      'Essa ação também removerá o histórico associado. Não será possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setMetaDeleting(true);
            setMetaFormError(null);
            try {
              if (meta?.meta_id) await excluirMeta(meta.meta_id);
              setMetas((current) => current.filter((item) => item.meta_id !== meta?.meta_id));
              setMetaForm({ visible: false, mode: 'create', meta: null });
              Alert.alert('Sucesso', 'Meta excluída.');
              await carregarMetas();
            } catch (error) {
              setMetaFormError(error?.response?.data?.message || 'Não foi possível excluir a meta.');
              logApiErrors(error, 'Erro ao excluir meta');
            } finally {
              setMetaDeleting(false);
            }
          },
        },
      ],
    );
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={'padding'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {mode === 'metas' ? (
            <AppScreenHeader
              icon="target"
              title="Gerenciar metas"
              subtitle="Crie objetivos claros e acompanhe cada avanço no seu cofrinho."
              style={styles.metaScreenHeader}
            />
          ) : (
            <View style={styles.heroCard}>
              <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.heroLogo} />
              <Text style={styles.heroTitle}>Editar Informações</Text>
              <Text style={styles.heroSubtitle}>Gerencie suas informações pessoais — adicione, edite ou remova.</Text>
            </View>
          )}

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
                <CustomButton title="Salvar" onPress={salvarInfo} style={styles.saveButton} disabled={saving} loading={saving} />
              </View>
            </View>
          ) : (
            <View style={styles.sectionsWrap}>
              <View style={styles.metasIntroCard}>
                <View style={styles.metasIntroIcon}><Feather name="target" size={20} color="#893467" /></View>
                <View style={styles.metasIntroCopy}>
                  <Text style={styles.metasIntroTitle}>Seus objetivos</Text>
                  <Text style={styles.metasIntroSubtitle}>Crie metas claras e acompanhe cada avanço no seu cofrinho.</Text>
                </View>
                <CustomButton title="Adicionar" accessibilityLabel="Adicionar meta" variant="primary" icon="plus" onPress={abrirNovaMeta} style={styles.addMetaAction} />
              </View>

              {metas.map((m, idx) => (
                <Pressable
                  key={m.meta_id || `meta-${idx}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir detalhes da meta ${m.meta_titulo || ''}`}
                  onPress={() => { if (m.meta_id) navigation.navigate('MetaDetails', { metaId: m.meta_id, meta: m }); }}
                  style={styles.metaEditorCard}
                >
                  <View style={styles.metaEditorHeader}>
                    <View style={styles.metaEditorTitleCopy}>
                      <Text style={styles.metaEditorEyebrow}>META {idx + 1}</Text>
                      <Text style={styles.metaEditorTitle} numberOfLines={1}>{m.meta_titulo || 'Nova meta'}</Text>
                    </View>
                    <View style={styles.metaEditorActions}>
                      <CustomButton accessibilityLabel={`Editar meta ${m.meta_titulo || ''}`} variant="ghost" icon="pencil-outline" iconOnly onPress={(event) => { event.stopPropagation?.(); abrirEdicaoMeta(m); }} style={styles.metaEditorIconButton} />
                      <CustomButton accessibilityLabel={`Excluir meta ${m.meta_titulo || ''}`} variant="danger" icon="trash-can-outline" iconOnly onPress={(event) => { event.stopPropagation?.(); confirmarExclusaoMeta(m); }} style={[styles.metaEditorIconButton, styles.metaEditorDeleteButton]} />
                    </View>
                  </View>
                  <View style={styles.metaCardMetrics}>
                    <View>
                      <Text style={styles.metaMetricLabel}>Objetivo</Text>
                      <Text style={styles.metaMetricValue}>{formatarValorMeta(m.meta_valor) || 'Valor não informado'}</Text>
                    </View>
                    <View style={styles.metaCardProgressCopy}>
                      <Text style={styles.metaMetricLabel}>Progresso</Text>
                      <Text style={styles.metaMetricValue}>{formatarPercentualMeta(m.progresso_percentual)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaProgressRow}>
                    <View accessible accessibilityLabel={`Progresso da meta: ${formatarPercentualMeta(m.progresso_percentual)}`} style={styles.metaProgressTrack}>
                      <View style={[styles.metaProgressFill, { width: `${Math.min(100, Math.max(0, Number(m.progresso_percentual) || 0))}%` }]} />
                    </View>
                    <Text style={styles.metaProgressPercent}>{formatarPercentualMeta(m.progresso_percentual)}</Text>
                  </View>
                  <Text style={styles.metaStatus}>{m.meta_completado ? 'Concluída' : 'Em acompanhamento'}</Text>
                </Pressable>
              ))}
              {metas.length === 0 ? <Text style={styles.metaEmptyState}>Você ainda não tem metas cadastradas. Crie a primeira para começar.</Text> : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <MetaFormSheet
        visible={metaForm.visible}
        mode={metaForm.mode}
        meta={metaForm.meta}
        onClose={() => { if (!metaFormSaving && !metaDeleting) setMetaForm({ visible: false, mode: 'create', meta: null }); }}
        onSubmit={salvarMetaFormulario}
        onDelete={() => confirmarExclusaoMeta(metaForm.meta)}
        saving={metaFormSaving}
        deleting={metaDeleting}
        error={metaFormError}
      />
    </SafeAreaView>
  );
}
