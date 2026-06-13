/**
 * Arquivo: PreferencesForm/index.js
 * Descrição: Componente reutilizável para edição de preferências de orçamento e categorias.
 * Utilizado tanto no SignUp (Step 2) quanto na tela de edição de perfil.
 */

import React, { useState } from 'react';
import { ScrollView, View, Text, Modal, Pressable, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import LimitSlider from '../LimitSlider';
import ProfileCard from '../ProfileComponents/ProfileCard';
import CustomButton from '../CustomButton';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants';
import styles from './styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomTextInput from '../CustomTextInput';
import { apiClient } from '../../api/client';

/**
 * Componente: PreferencesForm
 * Props:
 *   - quantidadeComprasMes: string
 *   - onQuantidadeComprasChange: (valor: string) => void
 *   - valorMaximoCompra: string
 *   - onValorMaximoCompraChange: (valor: string) => void
 *   - limiteGastoValor: number
 *   - onLimiteGastoChange: (valor: number) => void
 *   - limiteTempo: number (em horas)
 *   - onLimiteTempoChange: (valor: number) => void
 *   - selectedCategories: array
 *   - onRemoverCategoria: (categoriaId: number) => void
 *   - onAdicionarCategoria: (category: object) => void
 *   - onAtualizarLimiteCategoria: (categoriaId: number, novoValor: number) => void
 *   - onSalvar: async () => void
 *   - onCancel?: () => void (para modo edição)
 *   - isEditing?: boolean (true para ProfileScreen edit, false para SignUp)
 */
export default function PreferencesForm({
  quantidadeComprasMes,
  onQuantidadeComprasChange,
  valorMaximoCompra,
  onValorMaximoCompraChange,
  limiteGastoValor,
  onLimiteGastoChange,
  limiteTempo,
  onLimiteTempoChange,
  selectedCategories,
  onRemoverCategoria,
  onAdicionarCategoria,
  onAtualizarLimiteCategoria,
  onSalvar,
  onCancel,
  isEditing = false,
  obterSomaLimitesCategorias,
}) {
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [stepTwoTouched, setStepTwoTouched] = useState(false);
  const [stepTwoAttempted, setStepTwoAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metaBloqueada, setMetaBloqueada] = useState(false);

  const somaCategoriasSelecionadas = obterSomaLimitesCategorias(selectedCategories);
  const limiteMensalAtual = Number(limiteGastoValor) || 0;
  const valorDistribuido = somaCategoriasSelecionadas;
  const valorRestante = Math.max(0, limiteMensalAtual - valorDistribuido);
  const percentualDistribuido = limiteMensalAtual > 0 ? (valorDistribuido / limiteMensalAtual) * 100 : 0;
  const excessoCategorias = Math.max(0, somaCategoriasSelecionadas - limiteMensalAtual);
  const stepTwoInvalido = excessoCategorias > 0;
  const mostrarErroStepTwo = (stepTwoTouched || stepTwoAttempted) && stepTwoInvalido;
  const stepTwoErro = mostrarErroStepTwo ? `A soma dos limites por categoria não pode exceder o limite mensal.` : '';

  function abrirTelinhaCategorias() {
    setCategoryModalVisible(true);
    listarCategorias();
  }

  function fecharTelinhaCategorias() {
    setCategoryModalVisible(false);
  }

  function listarCategorias() {
    setCategoriesLoading(true);
    apiClient
      .get('/categories')
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => logApiErrors(error, 'Erro ao listar categorias'))
      .finally(() => {
        setCategoriesLoading(false);
      });
  }

  function selecionarCategoria(category) {
    setStepTwoTouched(true);
    onAdicionarCategoria(category);
    fecharTelinhaCategorias();
  }

  function atualizarQuantidadeComprasMes(valor) {
    const somenteDigitos = valor.replace(/\D/g, '');
    onQuantidadeComprasChange(somenteDigitos);
  }

  function atualizarLimiteMensal(valor) {
    setStepTwoTouched(true);
    const numero = Number(valor || 0) / 100;
    onLimiteGastoChange(numero);
  }

  async function handleSalvar() {
    setSaving(true);
    try {
      setStepTwoAttempted(true);
      if (stepTwoInvalido) {
        Alert.alert('Limites inválidos', 'A soma dos limites por categoria não pode ultrapassar o limite mensal de gasto.');
        setSaving(false);
        return;
      }
      await onSalvar();
    } catch (error) {
      logApiErrors(error, 'Erro ao salvar preferências');
      setSaving(false);
    }
  }

  function formatarReaisParaTela(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return '';
    }

    return `R$ ${numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
      <Text style={styles.titulo}>Preferências</Text>

      {/* Cabeçalho (só aparece em modo edição) */}
      {isEditing && (
        <View style={styles.header}>
          <Text style={styles.title}>Editar Preferências</Text>
          <Text style={styles.subtitle}>Defina seus limites de gasto e preferências de compra.</Text>
        </View>
      )}

      {/* Campos de entrada rápida */}
      <View style={styles.borderOverlay}>
        <View style={styles.stepTwoExtraFields}>
          <View style={styles.stepTwoFieldCard}>
            <Text style={styles.stepTwoFieldLabel}>Quantidade de compras por mês</Text>
            <TextInput style={styles.stepTwoFieldInput} value={quantidadeComprasMes} onChangeText={atualizarQuantidadeComprasMes} placeholder="Ex.: 8" keyboardType="numeric" maxLength={3} />
          </View>

          <View style={styles.stepTwoFieldCard}>
            <Text style={styles.stepTwoFieldLabel}>Maior valor em uma única compra</Text>
            <CustomTextInput
              placeholder="R$ 0,00"
              value={String((Number(valorMaximoCompra) || 0) * 100)}
              onChangeText={(texto) => {
                const numero = Number(texto || 0) / 100;
                onValorMaximoCompraChange(numero);
              }}
              keyboardType="numeric"
              mask="currency"
            />
          </View>

          <View style={styles.stepTwoFieldCard}>
            <View style={styles.fieldHeader}>
              <Text style={styles.stepTwoFieldLabel}>Limite mensal de gasto</Text>

              <TouchableOpacity onPress={() => setMetaBloqueada(!metaBloqueada)}>
                <MaterialCommunityIcons name={metaBloqueada ? 'lock' : 'lock-open-variant'} size={22} color={metaBloqueada ? COLORS.dadoDois : COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <CustomTextInput
              placeholder="R$ 0,00"
              value={formatarReaisParaTela(limiteGastoValor)}
              onChangeText={(texto) => {
                const numero = Number(texto.replace(/\D/g, ''));
                atualizarLimiteMensal(numero);
              }}
              keyboardType="numeric"
              mask="currency"
            />
          </View>
        </View>
        <View style={styles.budgetSummary}>
          <Text style={styles.summaryValue}>
            R$ {valorDistribuido.toFixed(2)} / R$ {limiteMensalAtual.toFixed(2)}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentualDistribuido, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.stepTwoHelperText}>Escolha um teto mensal confortável para comprar sem pesar no bolso.</Text>
        <LimitSlider title="Limite de tempo em e-commerces" min={0} max={360} step={10} initialValue={limiteTempo} horas compact onValueChange={onLimiteTempoChange} />
        <Text style={styles.stepTwoHelperText}>Defina um tempo diário saudável para navegar em sites de compras.</Text>
      </View>

      {/* Erro de validação */}
      {mostrarErroStepTwo && <Text style={styles.stepTwoErrorText}>{stepTwoErro}</Text>}

      {/* Botão para adicionar categorias */}
      <TouchableOpacity activeOpacity={0.8} style={styles.segmentAction} onPress={abrirTelinhaCategorias}>
        <Text style={styles.segmentActionText}>Adicionar limites por segmento +</Text>
      </TouchableOpacity>

      {/* Modal de seleção de categorias */}
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

      {/* Categorias selecionadas */}
      {selectedCategories.map((category) => (
        <ProfileCard key={category.categoria_id} title={category.categoria_nome} onRemove={() => onRemoverCategoria(category.categoria_id)} style={{ width: '95%' }}>
          <LimitSlider
            title="Limite mensal"
            min={0}
            max={1000}
            step={10}
            valor
            compact
            value={category.limite}
            onValueChange={(novoValor) => {
              if (!metaBloqueada) {
                onAtualizarLimiteCategoria(category.categoria_id, novoValor);
                return;
              }

              const somaOutrasCategorias = selectedCategories.filter((c) => c.categoria_id !== category.categoria_id).reduce((acc, c) => acc + Number(c.limite || 0), 0);

              const totalNovo = somaOutrasCategorias + novoValor;

              if (totalNovo <= limiteMensalAtual) {
                onAtualizarLimiteCategoria(category.categoria_id, novoValor);
              }
            }}
          />
        </ProfileCard>
      ))}

      {/* Botões de ação */}
      <View style={styles.actionsRow}>
        {isEditing && onCancel && <CustomButton title="Cancelar" onPress={onCancel} style={styles.cancelButton} />}
        <CustomButton title={saving ? 'Salvando...' : isEditing ? 'Salvar Preferências' : 'Finalizar'} onPress={handleSalvar} style={styles.submitButton} />
      </View>
    </ScrollView>
  );
}
