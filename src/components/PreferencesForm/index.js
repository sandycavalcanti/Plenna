/**
 * Arquivo: PreferencesForm/index.js
 * Descrição: Componente reutilizável para edição de preferências de orçamento e categorias.
 * Utilizado tanto no SignUp (Step 2) quanto na tela de edição de perfil.
 */

import React, { useLayoutEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, Modal, Pressable, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import LimitSlider from '../LimitSlider';
import ProfileCard from '../ProfileComponents/ProfileCard';
import CustomButton from '../CustomButton';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants';
import styles from './styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MoneyInput from '../MoneyInput';
import useMoneyEditors from './useMoneyEditors';
import { categoriaEhOutros } from '../../utils/categorias';
import { validarValorMonetario } from '../../utils/orcamento';

function InfoButton({ title, message }) {
  return (
    <TouchableOpacity
      onPress={() => Alert.alert(title, message, [{ text: 'Entendi' }])}
      style={styles.infoButton}
      accessibilityRole="button"
      accessibilityLabel={`Saiba mais: ${title}`}
      accessibilityHint="Abre uma explicação sobre este campo"
    >
      <MaterialCommunityIcons name="information-outline" size={22} color={COLORS.cadCaixaPreferenciasTitulo} accessible={false} />
    </TouchableOpacity>
  );
}

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
  valorAtencaoConfigurado = Number(valorMaximoCompra) > 0,
  onRemoverValorAtencao,
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
  categories = [],
  categoriesLoading = false,
  categoriesError = '',
  onRecarregarCategorias,
}) {
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metaBloqueada, setMetaBloqueada] = useState(false);
  const savingRef = useRef(false);
  const actionRef = useRef(false);
  const removalPending = useRef(false);
  const mounted = useRef(true);
  const [attentionEditorVersion, setAttentionEditorVersion] = useState(0);
  const [attentionFeedback, setAttentionFeedback] = useState('');
  const latest = useRef(null);
  const { registerEditor, confirmEdits } = useMoneyEditors({ canConfirm: () => !removalPending.current });
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useLayoutEffect(() => {
    latest.current = {
      onSalvar, onLimiteGastoChange, onAdicionarCategoria, onRemoverCategoria,
      onAtualizarLimiteCategoria, metaBloqueada, limiteGastoValor, selectedCategories,
      onRemoverValorAtencao,
    };
  });

  async function afterConfirmation(action) {
    if (savingRef.current || actionRef.current) return;
    actionRef.current = true;
    try {
      if (await confirmEdits()) return action(latest.current);
    } finally {
      actionRef.current = false;
    }
  }

  async function alternarCadeado() {
    await afterConfirmation(() => setMetaBloqueada((anterior) => !anterior));
  }

  function finalizarEdicaoMonetaria() {
    // Abrir a confirmação de remoção não deve publicar rascunhos de outros campos.
    if (actionRef.current || savingRef.current) return false;
    return confirmEdits();
  }

  function solicitarRemocaoAtencao() {
    if (savingRef.current || actionRef.current || !onRemoverValorAtencao) return;
    actionRef.current = true;
    removalPending.current = true;
    let started = false;
    let cancelled = false;
    const cancelar = () => {
      if (!started) {
        cancelled = true;
        actionRef.current = false;
        removalPending.current = false;
      }
    };
    Alert.alert(
      'Remover valor de atenção?',
      'Novos alertas por esse valor serão desativados. Compras e notificações anteriores serão mantidas.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: cancelar },
        { text: 'Remover', onPress: async () => {
          if (started || cancelled || !mounted.current || savingRef.current) return;
          started = true;
          savingRef.current = true;
          setSaving(true);
          setAttentionFeedback('');
          try {
            await latest.current.onRemoverValorAtencao();
            if (mounted.current) {
              // Descartar somente o rascunho do campo explicitamente removido.
              setAttentionEditorVersion((version) => version + 1);
              setAttentionFeedback('Valor de atenção removido.');
            }
          } catch {
            if (mounted.current) {
              setAttentionEditorVersion((version) => version + 1);
              Alert.alert('Remoção não confirmada', 'Não foi possível confirmar a remoção. Consulte novamente suas preferências antes de tentar outra vez.');
            }
          } finally {
            savingRef.current = false;
            actionRef.current = false;
            removalPending.current = false;
            if (mounted.current) setSaving(false);
          }
        } },
      ],
      { cancelable: true, onDismiss: cancelar },
    );
  }

  async function confirmarAntesDoSlider() {
    if (savingRef.current || actionRef.current) return false;
    const ok = await confirmEdits();
    return ok && !savingRef.current && !actionRef.current;
  }

  const categoriasEspecificas = selectedCategories.filter(
    (categoria) => !categoriaEhOutros(categoria)
  );
  const somaCategoriasSelecionadas = obterSomaLimitesCategorias(categoriasEspecificas);
  const limiteMensalAtual = Number(limiteGastoValor) || 0;
  const valorAtencaoAtual = Number(valorMaximoCompra) || 0;
  const mostrarOrientacaoAtencao =
    limiteMensalAtual > 0 &&
    valorAtencaoAtual > limiteMensalAtual;
  const valorDistribuido = somaCategoriasSelecionadas;
  const valorRestante = Math.max(0, limiteMensalAtual - valorDistribuido);
  const percentualDistribuido = limiteMensalAtual > 0 ? (valorDistribuido / limiteMensalAtual) * 100 : 0;
  const excessoCategorias = Math.max(0, somaCategoriasSelecionadas - limiteMensalAtual);
  const stepTwoInvalido = metaBloqueada && excessoCategorias > 0;
  const restantePermitido = limiteMensalAtual - somaCategoriasSelecionadas;
  const catalogoPronto = !categoriesLoading && !categoriesError && categories.length > 0;

  function abrirTelinhaCategorias() {
    setCategoryModalVisible(true);
  }

  function fecharTelinhaCategorias() {
    setCategoryModalVisible(false);
  }

  async function selecionarCategoria(category) {
    await afterConfirmation((atual) => {
      atual.onAdicionarCategoria(category);
      fecharTelinhaCategorias();
    });
  }

  function atualizarQuantidadeComprasMes(valor) {
    const somenteDigitos = valor.replace(/\D/g, '');
    onQuantidadeComprasChange(somenteDigitos);
  }

  function atualizarLimiteMensal(valor) {
    const numero = valor;
    onLimiteGastoChange(numero, metaBloqueada);
  }

  async function handleSalvar() {
    if (savingRef.current || actionRef.current) return;
    if (!catalogoPronto) {
      Alert.alert('Categorias indisponíveis', 'Carregue o catálogo de categorias antes de salvar.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (!await confirmEdits()) return;
      const atual = latest.current;
      const somaAtual = obterSomaLimitesCategorias(atual.selectedCategories);
      if (atual.metaBloqueada && somaAtual > Number(atual.limiteGastoValor)) {
        return;
      }
      await atual.onSalvar(atual.metaBloqueada);
    } catch (error) {
      logApiErrors(error, 'Erro ao salvar preferências');
    } finally {
      savingRef.current = false;
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
    <>
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
            <TextInput
              style={styles.stepTwoFieldInput}
              value={quantidadeComprasMes}
              onChangeText={atualizarQuantidadeComprasMes}
              placeholder="Ex.: 8"
              keyboardType="numeric"
              editable={!saving}
              maxLength={3}
              placeholderTextColor={'rgba(0,0,0,0.4)'}
            />
          </View>

          <View style={styles.stepTwoFieldCard}>
            <View style={styles.fieldHeader}>
              <Text style={[styles.stepTwoFieldLabel, styles.fieldLabelFlexible]}>Valor de atenção por compra</Text>
              <InfoButton title="Valor de atenção por compra" message="Opcional. É uma referência para alertas sobre uma compra, independente do orçamento mensal. Pode ser maior que o orçamento e não impede salvar. Para desativar um valor salvo, use Remover valor de atenção; apagar o texto não confirma a remoção." />
            </View>
            <Text style={styles.fieldCaption}>Opcional · independente do orçamento</Text>
            <MoneyInput
              key={`attention-${attentionEditorVersion}`}
              placeholder="R$ 0,00"
              accessibilityLabel="Valor de atenção por compra"
              value={valorMaximoCompra}
              emptyValue=""
              onConfirm={(valor) => {
                const error = onValorMaximoCompraChange(valor);
                if (!error) setAttentionFeedback('');
                return error;
              }}
              registerEditor={registerEditor}
              onFinishEditing={finalizarEdicaoMonetaria}
              editable={!saving}
              inputStyle={styles.moneyInput}
              focusStyle={styles.moneyInputFocused}
              errorStyle={styles.moneyInputError}
            />
            {!valorAtencaoConfigurado && <Text style={styles.fieldCaption}>Valor de atenção não definido</Text>}
            {isEditing && valorAtencaoConfigurado && onRemoverValorAtencao && (
              <TouchableOpacity
                onPress={solicitarRemocaoAtencao}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Remover valor de atenção"
                accessibilityHint="Pede confirmação antes de desativar somente este parâmetro"
                accessibilityState={{ disabled: saving }}
                style={styles.removeAttentionButton}
              >
                <Text style={styles.removeAttentionText}>Remover valor de atenção</Text>
              </TouchableOpacity>
            )}
            {attentionFeedback ? <Text style={styles.fieldCaption} accessibilityLiveRegion="polite">{attentionFeedback}</Text> : null}
              {mostrarOrientacaoAtencao && (
                <Text style={styles.stepTwoHelperText} accessibilityRole="text">
                  Acima do orçamento mensal. Você pode manter esse valor.
                </Text>
              )}
          </View>

          <View style={styles.stepTwoFieldCard}>
            <View style={styles.fieldHeader}>
              <Text style={[styles.stepTwoFieldLabel, styles.fieldLabelFlexible]}>Limite mensal de gasto</Text>

              <View style={styles.fieldActions}>
                <TouchableOpacity
                  onPress={alternarCadeado}
                  style={styles.lockButton}
                  hitSlop={8}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={metaBloqueada ? 'Desbloquear orçamento mensal' : 'Bloquear orçamento mensal'}
                  accessibilityState={{ disabled: saving }}
                  accessibilityHint={metaBloqueada ? 'Orçamento fixo. Toque para permitir ajustes pelas categorias.' : 'Orçamento ajustável. Toque para manter um teto fixo.'}
                >
                  <MaterialCommunityIcons name={metaBloqueada ? 'lock' : 'lock-open-variant'} size={22} color={metaBloqueada ? COLORS.dadoDois : COLORS.textSecondary} />
                </TouchableOpacity>
                <InfoButton title="Cadeado do orçamento" message={metaBloqueada
                  ? 'Fechado: o orçamento fica fixo. Aumentos de categorias respeitam o saldo disponível. Se você reduzir o orçamento, os valores existentes são preservados para redistribuir aos poucos.'
                  : 'Aberto: o orçamento aumenta quando as categorias superam sua referência. Ao reduzir ou remover categorias, retorna à referência que você definiu, sem ficar abaixo dela.'} />
              </View>
            </View>
            <MoneyInput
              placeholder="R$ 0,00"
              accessibilityLabel="Limite mensal de gasto"
              value={limiteGastoValor}
              onConfirm={atualizarLimiteMensal}
              required
              registerEditor={registerEditor}
              onFinishEditing={finalizarEdicaoMonetaria}
              editable={!saving}
              inputStyle={styles.moneyInput}
              focusStyle={styles.moneyInputFocused}
              errorStyle={styles.moneyInputError}
            />
            <Text style={styles.fieldCaption}>{metaBloqueada ? 'Orçamento fixo' : 'Ajustável às categorias'}</Text>
          </View>
        </View>
        <View style={styles.budgetSummary}>
          <Text style={styles.summaryValue}>
            Distribuído: {formatarReaisParaTela(valorDistribuido)} de {formatarReaisParaTela(limiteMensalAtual)}
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
        <LimitSlider title="Limite de tempo em e-commerces" min={0} max={360} step={10} initialValue={limiteTempo} horas compact onValueChange={onLimiteTempoChange} beforeSliderChange={confirmarAntesDoSlider} disabled={saving} />
        <Text style={styles.stepTwoHelperText}>Defina um tempo diário saudável para navegar em sites de compras.</Text>
      </View>

      {/* Erro de validação */}
      {stepTwoInvalido && (
        <Text style={styles.budgetNotice} accessibilityLiveRegion="polite">
          Redistribua {formatarReaisParaTela(excessoCategorias)} nas categorias para caber no orçamento. Você pode reduzir aos poucos.
        </Text>
      )}
      {categoriesLoading && <Text accessibilityRole="text">Carregando categorias...</Text>}
      {categoriesError ? (
        <View>
          <Text accessibilityRole="alert" style={styles.stepTwoErrorText}>{categoriesError}</Text>
          <CustomButton title="Tentar carregar categorias novamente" onPress={onRecarregarCategorias} disabled={categoriesLoading || saving} />
        </View>
      ) : null}

      {/* Botão para adicionar categorias */}
      <TouchableOpacity activeOpacity={0.8} style={styles.segmentAction} onPress={abrirTelinhaCategorias} disabled={saving || !catalogoPronto}>
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
                data={categories.filter((categoria) => !categoriaEhOutros(categoria))}
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
      {categoriasEspecificas.map((category) => {
        // Em conflito, incluir o valor atual evita normalização ou corte visual.
        const saldoCategoria = Math.round((restantePermitido + Number(category.limite || 0)) * 100) / 100;
        const maximoCategoria = Math.max(0, Number(category.limite || 0), saldoCategoria);
        return (
        <ProfileCard key={category.categoria_id} title={category.categoria_nome} onRemove={() => afterConfirmation(({ onRemoverCategoria, metaBloqueada }) => onRemoverCategoria(category.categoria_id, metaBloqueada))} style={{ width: '95%' }}>
          <LimitSlider
            title="Limite mensal"
            min={0}
            max={metaBloqueada ? maximoCategoria : Math.max(10000, limiteMensalAtual, Number(category.limite || 0))}
            step={metaBloqueada ? Math.max(0.01, Math.min(10, maximoCategoria / 100), maximoCategoria / 1000) : Math.max(10, limiteMensalAtual / 1000, Number(category.limite || 0) / 1000)}
            maxAllowedValue={metaBloqueada ? maximoCategoria : null}
            valor
            compact
            moneyEditing
            registerMoneyEditor={registerEditor}
            beforeSliderChange={confirmarAntesDoSlider}
            disabled={saving}
            value={category.limite}
            onValueChange={(novoValor) => {
              try {
                validarValorMonetario(novoValor);
                const somaOutras = obterSomaLimitesCategorias(categoriasEspecificas.filter((item) => item.categoria_id !== category.categoria_id));
                validarValorMonetario((Math.round(somaOutras * 100) + Math.round(novoValor * 100)) / 100);
              } catch (error) {
                return error.message;
              }
              if (!metaBloqueada) {
                onAtualizarLimiteCategoria(category.categoria_id, novoValor);
                return;
              }


              onAtualizarLimiteCategoria(category.categoria_id, novoValor, true);
            }}
          />
        </ProfileCard>
        );
      })}

      {/* Outros: saldo automático do orçamento */}
      <View style={styles.automaticBalance}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.stepTwoFieldLabel, styles.fieldLabelFlexible]}>Outros</Text>
          <InfoButton title="Saldo de Outros" message="Outros recebe automaticamente a diferença entre o orçamento mensal e as categorias específicas, sem ficar negativo. É reservado para compras fora dessas categorias e não precisa ser editado." />
        </View>
        <Text style={styles.balanceCaption}>Saldo automático</Text>
        <Text style={styles.balanceValue} accessibilityLabel={`Outros, saldo automático: ${formatarReaisParaTela(valorRestante)}`}>
          {formatarReaisParaTela(valorRestante)}
        </Text>
      </View>
      {/* Botões de ação */}
      <View style={styles.actionsRow}>
        {isEditing && onCancel && <CustomButton title="Cancelar" onPress={onCancel} style={styles.cancelButton} disabled={saving} />}
        <CustomButton title={saving ? 'Salvando...' : isEditing ? 'Salvar Preferências' : 'Finalizar'} onPress={handleSalvar} style={styles.submitButton} disabled={saving || !catalogoPronto} />
      </View>
    </>
  );
}
