import { styles } from "./PerguntaContexto.styles";
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { rotuloOpcao } from './fluxo';
const c = DASHBOARD_THEME.colors;
export function PerguntaContexto({
  pergunta,
  valor,
  position,
  total,
  disabled,
  registrada,
  onChoose
}) {
  return <View style={styles.questionBody}>
    <View style={styles.row}>
      <Text accessibilityLiveRegion="polite" style={styles.caption}>Pergunta {position + 1} de {total}</Text>
      <Text style={styles.badge}>Opcional</Text>
    </View>
    <View accessibilityRole="progressbar" accessibilityLabel="Progresso das perguntas opcionais" accessibilityValue={{
      min: 0,
      max: total,
      now: position + 1
    }} style={styles.track}>
      <View style={[styles.fill, {
        width: `${100 * (position + 1) / total}%`
      }]} />
    </View>
    <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.question}>{pergunta.texto}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={pergunta.texto} style={styles.options}>
      {pergunta.opcoes.map(opcao => {
        const selected = valor === opcao.valor;
        return <Pressable key={opcao.valor} accessibilityRole="radio" accessibilityLabel={rotuloOpcao(opcao)} accessibilityState={{
          checked: selected,
          disabled
        }} disabled={disabled} onPress={() => onChoose(opcao.valor)} style={({
          pressed
        }) => [styles.option, selected && styles.selected, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
          <Text style={[styles.optionText, selected && styles.selectedText]}>{rotuloOpcao(opcao)}</Text>
          <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={selected ? c.navy : c.muted} />
        </Pressable>;
      })}
    </View>
    {registrada && valor != null && <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onChoose(null)} style={styles.textAction}>
      <Text style={styles.link}>Remover resposta</Text>
    </Pressable>}
    {registrada && valor === null && <Text accessibilityLiveRegion="polite" style={styles.caption}>A resposta será removida ao salvar.</Text>}
    {!registrada && valor != null && <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onChoose(undefined)} style={styles.textAction}>
      <Text style={styles.link}>Limpar escolha</Text>
    </Pressable>}
    <View style={styles.reassurance}><Ionicons name="information-circle-outline" size={18} color={c.navy} />
      <Text style={styles.caption}>Você escolhe o que contar. Sem julgamentos.</Text>
    </View>
  </View>;
}
export function AcoesContexto({
  position,
  total,
  valor,
  disabled,
  saving,
  onBack,
  onNext,
  onFinish
}) {
  const last = position === total - 1;
  return <View style={styles.footer}>
    <View style={styles.navigation}>
      {position > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Pergunta anterior" disabled={disabled} onPress={onBack} style={[styles.previous, disabled && styles.disabled]}>
        <Ionicons name="arrow-back" size={20} color={c.navy} />
        <Text style={styles.link}>Voltar</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" accessibilityState={{
        disabled,
        busy: saving
      }} disabled={disabled} onPress={onNext} style={[styles.primary, disabled && styles.disabled]}>
        {saving && <ActivityIndicator color={c.surface} size="small" />}
        <Text style={styles.primaryText}>{saving ? 'Salvando…' : last ? 'Concluir' : valor == null ? 'Pular por enquanto' : 'Continuar →'}</Text>
      </Pressable>
    </View>
    {!last && <Pressable accessibilityRole="button" accessibilityHint="Salva as escolhas feitas e encerra as perguntas" disabled={disabled} onPress={onFinish} style={styles.textAction}>
      <Text style={styles.secondaryText}>Concluir por agora</Text>
    </Pressable>}
  </View>;
}
