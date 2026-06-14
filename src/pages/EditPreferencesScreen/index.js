/**
 * Arquivo: EditPreferencesScreen/index.js
 * Descrição: Tela para edição de preferências de orçamento do usuário.
 * Utiliza o componente reutilizável PreferencesForm.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PreferencesForm from '../../components/PreferencesForm';
import { valorMonetarioParaNumero } from '../../components/CustomTextInput/currency';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import styles from './styles';

export default function EditPreferencesScreen() {
  const navigation = useNavigation();
  const [quantidadeComprasMes, setQuantidadeComprasMes] = useState('');
  const [valorMaximoCompra, setValorMaximoCompra] = useState('');
  const [limiteGastoValor, setLimiteGastoValor] = useState(290);
  const limiteTempo = useRef(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const respUser = await apiClient.get('/users/user');
      const dados = respUser.data || {};

      setQuantidadeComprasMes(String(dados.usuario_limite_compra || ''));
      setValorMaximoCompra(dados.usuario_meta_valor_compra !== undefined && dados.usuario_meta_valor_compra !== null ? String(Number(dados.usuario_meta_valor_compra)) : '');
      setLimiteGastoValor(Number(dados.usuario_meta_valor_mensal) || 290);
      limiteTempo.current = Number(dados.usuario_meta_tempo) || 0;

      // Carregar preferências por categoria salvas no backend
      const respPrefs = await apiClient.get('/preferencia');
      setSelectedCategories(
        Array.isArray(respPrefs.data)
          ? respPrefs.data.map((pref) => ({
              categoria_id: pref.categoria_id,
              categoria_nome: pref.categoria_nome || pref.tb_categoria?.categoria_nome,
              limite: Number(pref.preferencia_meta) || 0,
            }))
          : [],
      );
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar preferências do usuário');
    } finally {
      setLoading(false);
    }
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

  function removerCategoria(categoriaId) {
    setSelectedCategories((prevCategories) => {
      const nextCategories = prevCategories.filter((item) => item.categoria_id !== categoriaId);

      ajustarLimiteGastoParaCategorias(nextCategories);

      return nextCategories;
    });
  }

  async function salvarPreferencias() {
    try {
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

      // Atualizar dados do usuário
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

      if (Object.keys(payload).length > 0) {
        await apiClient.put('/users', payload);
      }

      // Persistir preferências por categoria
      await apiClient.put('/preferencia/bulk', {
        preferencias: categoriasBase.map((category) => ({
          categoriaId: category.categoria_id,
          metaMensal: category.limite,
        })),
      });

      Alert.alert('Sucesso', 'Preferências atualizadas com sucesso!');
      navigation.goBack();
    } catch (error) {
      logApiErrors(error, 'Erro ao salvar preferências');
    }
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
      <PreferencesForm
        quantidadeComprasMes={quantidadeComprasMes}
        onQuantidadeComprasChange={setQuantidadeComprasMes}
        valorMaximoCompra={valorMaximoCompra}
        onValorMaximoCompraChange={setValorMaximoCompra}
        limiteGastoValor={limiteGastoValor}
        onLimiteGastoChange={setLimiteGastoValor}
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
    </SafeAreaView>
  );
}
