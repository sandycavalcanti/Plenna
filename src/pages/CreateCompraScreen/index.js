import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, ActivityIndicator, TouchableOpacity, FlatList, Modal, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from './styles';
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import ProfileCard from '../../components/ProfileComponents/ProfileCard';

const classificacoes = ['PENDENTE', 'IMPULSIVA', 'NAO_IMPULSIVA'];

function parseNumber(raw) {
  if (raw === undefined || raw === null) return NaN;
  let s = String(raw).trim();
  s = s.replace(/[^0-9,.-]/g, '');
  const commaCount = (s.match(/,/g) || []).length;
  if (commaCount > 0 && s.indexOf('.') === -1) {
    s = s.replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

function formatarValorMoedaParaTela(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');

  if (!digitos) {
    return '';
  }

  const numero = Number(digitos) / 100;

  if (!Number.isFinite(numero)) {
    return '';
  }

  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)}`;
}

function normalizarValorMoedaParaEntrada(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

function valorMoedaParaNumero(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');

  if (!digitos) {
    return NaN;
  }

  return Number(digitos) / 100;
}

export default function CreateCompraScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);

  const [items, setItems] = useState([{ nome: '', valor: '', categoriaId: null }]);
  const [fonte, setFonte] = useState('');
  const [compraEmail, setCompraEmail] = useState(true);
  const [classificacao, setClassificacao] = useState('PENDENTE');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryPickerForIndex, setCategoryPickerForIndex] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedFormaPagamentoId, setSelectedFormaPagamentoId] = useState(null);

  useEffect(() => {
    listarDadosIniciais();
  }, []);

  async function listarDadosIniciais() {
    setLoading(true);
    try {
      const [respCats, respFormas] = await Promise.all([apiClient.get('/categories'), apiClient.get('/formas-pagamento')]);
      const categoriasCarregadas = Array.isArray(respCats.data) ? respCats.data : [];
      const formasCarregadas = Array.isArray(respFormas.data) ? respFormas.data : [];

      setCategories(categoriasCarregadas);
      setFormasPagamento(formasCarregadas);
      setSelectedFormaPagamentoId((current) => current ?? formasCarregadas[0]?.forma_pagamento_id ?? null);
    } catch (error) {
      CatchError(error);
    } finally {
      setLoading(false);
    }
  }

  function atualizarItem(index, campo, valor) {
    setItems((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  }

  function adicionarItem() {
    setItems((prev) => [...prev, { nome: '', valor: '', categoriaId: null }]);
  }

  function removerItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function abrirSeletorCategoria(index) {
    setCategoryPickerForIndex(index);
    setCategoryModalVisible(true);
  }

  function selecionarCategoriaParaItem(category) {
    if (categoryPickerForIndex === null) return;
    atualizarItem(categoryPickerForIndex, 'categoriaId', category.categoria_id);
    setCategoryModalVisible(false);
    setCategoryPickerForIndex(null);
  }

  function selecionarFormaPagamento(formaPagamento) {
    setSelectedFormaPagamentoId(formaPagamento.forma_pagamento_id);
    setPaymentModalVisible(false);
  }

  function obterNomeFormaPagamentoSelecionada() {
    if (!selectedFormaPagamentoId) {
      return 'Selecionar forma de pagamento';
    }

    return formasPagamento.find((forma) => forma.forma_pagamento_id === selectedFormaPagamentoId)?.forma_pagamento_nome || 'Selecionar forma de pagamento';
  }

  async function handleSalvar() {
    setSaving(true);
    try {
      if (!items || items.length === 0) {
        Alert.alert('Erro', 'Adicione ao menos um item à compra.');
        setSaving(false);
        return;
      }

      const payloadItems = [];
      for (const it of items) {
        const nome = (it.nome || '').trim();
        const valor = valorMoedaParaNumero(it.valor);
        const categoriaId = Number(it.categoriaId || 0);

        if (!nome) {
          Alert.alert('Campo obrigatório', 'Todos os itens precisam de um nome.');
          setSaving(false);
          return;
        }

        if (!Number.isFinite(valor) || valor <= 0) {
          Alert.alert('Valor inválido', 'Preencha um valor válido para todos os itens.');
          setSaving(false);
          return;
        }

        if (!categoriaId) {
          Alert.alert('Categoria', 'Selecione uma categoria para todos os itens.');
          setSaving(false);
          return;
        }

        payloadItems.push({ categoriaId, nome, valor });
      }

      const payload = {
        formaPagamentoId: selectedFormaPagamentoId ?? formasPagamento[0]?.forma_pagamento_id ?? 1,
        compraHorario: new Date().toISOString(),
        compraFonte: fonte || '',
        compraEmail: compraEmail,
        compraClassificacao: classificacao,
        items: payloadItems.map((it) => ({ categoriaId: it.categoriaId, nome: it.nome, valor: it.valor })),
      };

      await apiClient.post('/compras', payload);
      Alert.alert('Sucesso', 'Compra cadastrada.');
      navigation.goBack();
    } catch (error) {
      CatchError(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heroCard}>
        <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.heroLogo} />
        <Text style={styles.heroTitle}>Nova Compra</Text>
        <Text style={styles.heroSubtitle}>Adicione os itens da compra, escolha as categorias e finalize o cadastro.</Text>
      </View>

      <View style={styles.sectionsWrap}>
        <ProfileCard title="Itens" style={styles.sectionCard}>
          {items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <CustomTextInput placeholder="Nome do item" value={it.nome} onChangeText={(t) => atualizarItem(idx, 'nome', t)} style={styles.itemInput} />
              <CustomTextInput
                placeholder="R$ 0,00"
                value={formatarValorMoedaParaTela(it.valor)}
                onChangeText={(t) => atualizarItem(idx, 'valor', normalizarValorMoedaParaEntrada(t))}
                keyboardType="numeric"
                style={styles.itemInput}
              />
              <TouchableOpacity style={styles.selectCategoria} onPress={() => abrirSeletorCategoria(idx)}>
                <Text style={styles.selectCategoriaText}>{it.categoriaId ? categories.find((c) => c.categoria_id === it.categoriaId)?.categoria_nome || 'Categoria' : 'Selecionar categoria'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removerItem(idx)} style={styles.removeItemButton}>
                <Text style={styles.removeItemText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity onPress={adicionarItem} style={styles.addItemButton}>
            <Text style={styles.addItemText}>Adicionar item</Text>
          </TouchableOpacity>
        </ProfileCard>

        <ProfileCard title="Informações" style={styles.sectionCard}>
          <TouchableOpacity style={styles.selectCategoria} onPress={() => setPaymentModalVisible(true)}>
            <Text style={styles.selectCategoriaText}>{obterNomeFormaPagamentoSelecionada()}</Text>
          </TouchableOpacity>
          <CustomTextInput placeholder="Fonte (ex: site)" value={fonte} onChangeText={setFonte} />
        </ProfileCard>

        <View style={styles.actionsRow}>
          <CustomButton title={saving ? 'Salvando...' : 'Salvar Compra'} onPress={handleSalvar} style={styles.saveButton} />
        </View>
      </View>

      <Modal transparent visible={categoryModalVisible} animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
        <Pressable style={styles.pressableFecharModal} onPress={() => setCategoryModalVisible(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.questionTitle}>Selecione a categoria</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.categoria_id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoriaNomeTouchable} onPress={() => selecionarCategoriaParaItem(item)}>
                  <Text style={styles.categoriaNome}>{item.categoria_nome}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.textoFecharModalTouchable}>
              <Text style={styles.textoFecharModal}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={paymentModalVisible} animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <Pressable style={styles.pressableFecharModal} onPress={() => setPaymentModalVisible(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.questionTitle}>Selecione a forma de pagamento</Text>
            <FlatList
              data={formasPagamento}
              keyExtractor={(item) => String(item.forma_pagamento_id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoriaNomeTouchable} onPress={() => selecionarFormaPagamento(item)}>
                  <Text style={styles.categoriaNome}>{item.forma_pagamento_nome}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.textoFecharModalTouchable}>
              <Text style={styles.textoFecharModal}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
