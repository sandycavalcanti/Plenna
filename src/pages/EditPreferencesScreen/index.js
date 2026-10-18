import { categoriaEhOutros } from '../../utils/categorias';
/**
 * Arquivo: EditPreferencesScreen/index.js
 * Descrição: Tela para edição de preferências de orçamento do usuário.
 * Utiliza o componente reutilizável PreferencesForm.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, Alert, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PreferencesForm from '../../components/PreferencesForm';
import { calcularOrcamento } from '../../utils/orcamento';
import { apiClient } from '../../api/client';
import { distribuirSobraEmOutros, obterIdCategoriaOutros, validarCatalogoCategorias } from '../../utils/categorias';
import { registrarFalhaPreferencias, mensagemValidacaoPreferencias } from '../../utils/preferenciasDiagnostico';
import styles from './styles';

export default function EditPreferencesScreen() {
  const navigation = useNavigation();
  const [quantidadeComprasMes, setQuantidadeComprasMes] = useState('');
  const [valorMaximoCompra, setValorMaximoCompra] = useState('');
  const [valorAtencaoSalvo, setValorAtencaoSalvo] = useState(null);
  const valorAtencaoAlterado = useRef(false);
  const [limiteGastoValor, setLimiteGastoValor] = useState(290);
  const limiteGastoReferencia = useRef(290);
  const limiteTempo = useRef(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const loadingRequest = useRef(false);
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    if (loadingRequest.current) return;
    loadingRequest.current = true;
    setLoading(true);
    setLoadingError(false);
    let etapaCarregamento = 'CARREGAMENTO_USUARIO';
    try {
      const respUser = await apiClient.get('/users/user');
      const dados = respUser.data || {};

      setQuantidadeComprasMes(String(dados.usuario_limite_compra || ''));
      setValorMaximoCompra(dados.usuario_meta_valor_compra !== undefined && dados.usuario_meta_valor_compra !== null ? String(Number(dados.usuario_meta_valor_compra)) : '');
      setValorAtencaoSalvo(dados.usuario_meta_valor_compra ?? null);
      valorAtencaoAlterado.current = false;
      const metaMensal = Number(dados.usuario_meta_valor_mensal);
      const referenciaInicial = Number.isFinite(metaMensal) && metaMensal > 0 ? metaMensal : 290;
      limiteGastoReferencia.current = referenciaInicial;
      setLimiteGastoValor(referenciaInicial);
      limiteTempo.current = Number(dados.usuario_meta_tempo) || 0;

      // Carregar preferências por categoria salvas no backend
      etapaCarregamento = 'CATALOGO';
      const respCategorias = await apiClient.get('/categories');
      setCategories(validarCatalogoCategorias(respCategorias.data));

      etapaCarregamento = 'CARREGAMENTO_PREFERENCIAS';
      const respPrefs = await apiClient.get('/preferencia');
      if (!Array.isArray(respPrefs.data)) throw Object.assign(new Error('Preferências inválidas.'), { code: 'PREFERENCIAS_INVALIDAS' });
      validarCatalogoCategorias(respCategorias.data, respPrefs.data);
      if (respPrefs.data.some((pref) => !Number.isFinite(Number(pref.preferencia_meta)))) {
        throw Object.assign(new Error('Valor monetário inválido.'), { code: 'VALOR_MONETARIO_INVALIDO' });
      }
      setSelectedCategories(
        Array.isArray(respPrefs.data)
          ? respPrefs.data.map((pref) => ({
              categoria_id: pref.categoria_id,
              categoria_nome: respCategorias.data.find((categoria) => categoria.categoria_id === pref.categoria_id)?.categoria_nome || pref.categoria_nome || pref.tb_categoria?.categoria_nome,
              limite: Number(pref.preferencia_meta),
            }))
          : [],
      );
    } catch (error) {
      setLoadingError(true);
      registrarFalhaPreferencias(error, etapaCarregamento, 'EDICAO');
    } finally {
      loadingRequest.current = false;
      setLoading(false);
    }
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


      return nextCategories;
    });
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
    const nextCategories = selectedCategories.filter((item) => item.categoria_id !== categoriaId);
    if (!metaBloqueada) {
      ajustarLimiteGastoParaCategorias(nextCategories);
    }
    setSelectedCategories(nextCategories);
  }

  function atualizarValorAtencao(valor) {
    if ((valor === '' || Number(valor) === 0) && Number(valorAtencaoSalvo) > 0) {
      return 'Para desativar, use Remover valor de atenção. Ou informe um valor positivo.';
    }
    setValorMaximoCompra(valor);
    valorAtencaoAlterado.current = Number(valor) > 0;
  }

  async function removerValorAtencao() {
    // A intenção explícita de remover substitui a edição pendente deste campo.
    // Uma resposta perdida não pode fazer um salvamento posterior reenviar o valor antigo.
    valorAtencaoAlterado.current = false;
    try {
      const resposta = await apiClient.put('/users', { metaValorCompra: null });
      if (resposta?.data?.usuario_meta_valor_compra !== null) {
        throw new Error('Remoção não confirmada pela API.');
      }
      valorAtencaoAlterado.current = false;
      setValorAtencaoSalvo(null);
      setValorMaximoCompra('');
    } catch (error) {
      setValorMaximoCompra(valorAtencaoSalvo == null ? '' : String(Number(valorAtencaoSalvo)));
      registrarFalhaPreferencias(error, 'USUARIO', 'EDICAO');
      throw error;
    }
  }

  async function salvarPreferencias(metaBloqueada = false) {
    let etapaSalvamento = 'VALIDACAO';
    try {
      if (loading || loadingError) throw Object.assign(new Error('Carregamento incompleto.'), { code: 'CATALOGO_INVALIDO' });
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

      if (!Number.isFinite(limiteMensal) || limiteMensal <= 0) {
        throw new Error('ORCAMENTO_MENSAL_INVALIDO');
      }

      const categoriasBase = distribuirSobraEmOutros(
        resultadoOrcamento.categoriasValidas,
        categories,
        resultadoOrcamento.sobraParaOutros
      );

      if (
        categoriasBase.length === 0 ||
        categoriasBase.some(
          (categoria) =>
            !Number.isFinite(Number(categoria.limite)) ||
            Number(categoria.limite) <= 0
        )
      ) {
        throw new Error('PREFERENCIAS_INVALIDAS');
      }

      // Atualizar dados do usuário
      const payload = {};

      if (quantidadeComprasMes) {
        const num = Number(quantidadeComprasMes.replace(/\D/g, ''));
        if (!Number.isNaN(num)) payload.limiteCompra = num;
      }

      if (limiteMensal) {
        payload.metaValorMensal = limiteMensal;
      }

      if (valorAtencaoAlterado.current && Number(valorMaximoCompra) > 0) {
        const valorMaximoCompraNumerico = Number(valorMaximoCompra);
        if (!Number.isNaN(valorMaximoCompraNumerico)) {
          payload.metaValorCompra = valorMaximoCompraNumerico;
        }
      }

      if (limiteTempo.current !== undefined && limiteTempo.current !== null) {
        payload.metaTempo = Number(limiteTempo.current);
      }

      if (Object.keys(payload).length > 0) {
        etapaSalvamento = 'USUARIO';
        await apiClient.put('/users', payload);
        if (Object.hasOwn(payload, 'metaValorCompra')) {
          valorAtencaoAlterado.current = false;
          setValorAtencaoSalvo(payload.metaValorCompra);
        }
      }

      // Persistir preferências por categoria
      etapaSalvamento = 'PREFERENCIAS';
      await apiClient.put('/preferencia/bulk', {
        preferencias: categoriasBase.map((category) => ({
          categoriaId: category.categoria_id,
          metaMensal: category.limite,
        })),
      });

      Alert.alert('Sucesso', 'Preferências atualizadas com sucesso!');
      navigation.goBack();
    } catch (error) {
      registrarFalhaPreferencias(error, etapaSalvamento, 'EDICAO');

      if (etapaSalvamento === 'PREFERENCIAS') {
        Alert.alert(
          'Salvamento incompleto',
          'As metas podem ter sido atualizadas, mas não foi possível confirmar o salvamento das categorias. Confira os dados antes de tentar novamente.'
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

  if (loadingError && !loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text accessibilityRole="alert">Não foi possível carregar suas preferências e categorias.</Text>
        <TouchableOpacity accessibilityRole="button" onPress={carregarDados}>
          <Text>Tentar carregar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={'padding'}>
        <ScrollView style={styles.containerScroll} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <PreferencesForm
            categories={categories}
            quantidadeComprasMes={quantidadeComprasMes}
            onQuantidadeComprasChange={setQuantidadeComprasMes}
            valorMaximoCompra={valorMaximoCompra}
            onValorMaximoCompraChange={atualizarValorAtencao}
            valorAtencaoConfigurado={Number(valorAtencaoSalvo) > 0}
            onRemoverValorAtencao={removerValorAtencao}
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
            onSalvar={salvarPreferencias}
            onCancel={() => navigation.goBack()}
            isEditing={true}
            obterSomaLimitesCategorias={obterSomaLimitesCategorias}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
