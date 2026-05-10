import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './styles';
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { COLORS } from '../../constants';

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
        dataNascimento: dados.usuario_data_nascimento || '',
        limiteCompra: dados.usuario_limite_compra || '',
        metaValorCompra: dados.usuario_meta_valor_compra || '',
        metaTempo: dados.usuario_meta_tempo || '',
        gatilhoConsumo: dados.usuario_gatilho_consumo || '',
        tempoTela: dados.usuario_tempo_tela || '',
        incomodoConsumo: dados.usuario_incomodo_consumo || '',
      });

      const respGoals = await apiClient.get('/goals');
      setMetas(Array.isArray(respGoals.data) ? respGoals.data : []);
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
      if (user.dataNascimento !== undefined) payload.dataNascimento = user.dataNascimento;
      if (user.limiteCompra !== undefined && String(user.limiteCompra).trim() !== '') payload.limiteCompra = parseNumber(String(user.limiteCompra));
      if (user.metaValorCompra !== undefined && String(user.metaValorCompra).trim() !== '') payload.metaValorCompra = parseNumber(String(user.metaValorCompra));
      if (user.metaTempo !== undefined && String(user.metaTempo).trim() !== '') payload.metaTempo = Number(user.metaTempo);
      if (user.gatilhoConsumo !== undefined) payload.gatilhoConsumo = user.gatilhoConsumo;
      if (user.tempoTela !== undefined && String(user.tempoTela).trim() !== '') payload.tempoTela = Number(user.tempoTela);
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
      // Valida e converte valores antes de enviar
      for (const m of metas) {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>{mode === 'goals' ? 'Editar Metas' : 'Editar Informações'}</Text>
        <Text style={styles.subtitle}>{mode === 'goals' ? 'Gerencie suas metas financeiras — adicione, edite ou remova.' : 'Atualize suas informações e preferências.'}</Text>
      </View>

      {mode === 'info' ? (
        <View>
          <Text style={styles.label}>Nome</Text>
          <CustomTextInput value={user.nome} onChangeText={(t) => setUser((u) => ({ ...u, nome: t }))} placeholder="Nome" style={styles.inputWrapper} />

          <Text style={styles.label}>E-mail</Text>
          <CustomTextInput value={user.email} onChangeText={(t) => setUser((u) => ({ ...u, email: t }))} placeholder="E-mail" style={styles.inputWrapper} keyboardType="email-address" />

          <Text style={styles.label}>Telefone</Text>
          <CustomTextInput value={user.telefone} onChangeText={(t) => setUser((u) => ({ ...u, telefone: t }))} placeholder="Telefone" style={styles.inputWrapper} keyboardType="phone-pad" />

          <Text style={styles.label}>Data de nascimento</Text>
          <CustomTextInput value={user.dataNascimento} onChangeText={(t) => setUser((u) => ({ ...u, dataNascimento: t }))} placeholder="DD/MM/AAAA" style={styles.inputWrapper} />

          <Text style={styles.label}>Limite de compra</Text>
          <CustomTextInput
            value={String(user.limiteCompra || '')}
            onChangeText={(t) => setUser((u) => ({ ...u, limiteCompra: t }))}
            placeholder="R$"
            style={styles.inputWrapper}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Meta: Valor por compra</Text>
          <CustomTextInput
            value={String(user.metaValorCompra || '')}
            onChangeText={(t) => setUser((u) => ({ ...u, metaValorCompra: t }))}
            placeholder="R$"
            style={styles.inputWrapper}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Meta: Tempo</Text>
          <CustomTextInput
            value={String(user.metaTempo || '')}
            onChangeText={(t) => setUser((u) => ({ ...u, metaTempo: t }))}
            placeholder="Tempo (dias)"
            style={styles.inputWrapper}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Gatilho de consumo</Text>
          <CustomTextInput value={user.gatilhoConsumo} onChangeText={(t) => setUser((u) => ({ ...u, gatilhoConsumo: t }))} placeholder="Ex.: Promoções" style={styles.inputWrapper} />

          <Text style={styles.label}>Tempo de tela</Text>
          <CustomTextInput
            value={String(user.tempoTela || '')}
            onChangeText={(t) => setUser((u) => ({ ...u, tempoTela: t }))}
            placeholder="Minutos/dia"
            style={styles.inputWrapper}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Incomodo com consumo</Text>
          <CustomTextInput value={user.incomodoConsumo} onChangeText={(t) => setUser((u) => ({ ...u, incomodoConsumo: t }))} placeholder="Descreva" style={styles.inputWrapper} />

          <View style={styles.actionsRow}>
            <CustomButton title={saving ? 'Salvando...' : 'Salvar'} onPress={salvarInfo} style={{ width: '48%' }} />
          </View>
        </View>
      ) : (
        <View>
          {metas.map((m, idx) => (
            <View key={idx} style={styles.metaCard}>
              <Text style={styles.metaTitle}>{m.meta_titulo || 'Nova meta'}</Text>
              <CustomTextInput placeholder="Título" value={m.meta_titulo} onChangeText={(t) => atualizarMeta(idx, 'meta_titulo', t)} style={{ marginBottom: 6 }} />
              {/* descrição multiline usando TextInput para controlar linhas */}
              <TextInput
                placeholder="Descrição"
                value={m.meta_descricao || ''}
                onChangeText={(t) => atualizarMeta(idx, 'meta_descricao', t)}
                style={{
                  backgroundColor: COLORS.customTextInputFundo,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: 8,
                }}
                multiline
                numberOfLines={4}
              />
              <CustomTextInput placeholder="Valor" value={String(m.meta_valor || '')} onChangeText={(t) => atualizarMeta(idx, 'meta_valor', t)} keyboardType="numeric" />
            </View>
          ))}

          <View style={styles.actionsRow}>
            <CustomButton title="Adicionar Meta" onPress={adicionarMeta} style={{ width: '48%', backgroundColor: COLORS.cadCaixaPreferenciasValorFundo }} />
            <CustomButton title={saving ? 'Salvando...' : 'Salvar Metas'} onPress={salvarMetas} style={{ width: '48%' }} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
