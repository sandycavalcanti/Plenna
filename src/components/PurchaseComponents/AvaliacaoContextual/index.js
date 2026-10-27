import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarConsultaAvaliacao } from '../../../services/avaliacaoCompraService';

export default function AvaliacaoContextual({ compraId, revisao }) {
  const [state, setState] = useState({ status: 'loading', dados: null });
  const [details, setDetails] = useState(false);
  const service = useRef(null);
  useEffect(() => {
    setDetails(false);
    const instance = criarConsultaAvaliacao({
      compraId,
      client: apiClient,
      storage: tokenStorage,
      onChange: (s) => setState({ ...s, compraId, revisao }),
    });
    service.current = instance;
    instance.consultar();
    return () => instance.dispose();
  }, [compraId, revisao]);
  const current =
    state.compraId === compraId && state.revisao === revisao
      ? state
      : { status: 'loading', dados: null };
  const d = current.dados;
  // A context reload may occur before this effect: never flash an older interpretation.
  const stale =
    d?.atualidade === 'DESATUALIZADA' ||
    (d?.resultado && d.resultado.contextoRevisao !== revisao);
  const r = !stale && current.status === 'ready' ? d?.resultado : null;
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Uma reflexão para você
      </Text>
      {current.status === 'loading' && (
        <ActivityIndicator
          accessibilityLabel="Consultando reflexão"
          color="#8660A1"
        />
      )}
      {current.status === 'session' && (
        <Text style={styles.note}>Sua sessão mudou. Feche esta janela.</Text>
      )}
      {['error', 'conflict'].includes(current.status) && (
        <Text accessibilityRole="alert" style={styles.note}>
          {current.status === 'conflict'
            ? 'Suas respostas mudaram. Recarregue para continuar.'
            : 'A reflexão não está disponível agora. Você pode continuar explorando.'}
        </Text>
      )}
      {stale && (
        <Text accessibilityRole="alert" style={styles.note}>
          Esta reflexão está desatualizada. Atualize para considerar as
          informações atuais.
        </Text>
      )}
      {d?.atualidade === 'SEM_AVALIACAO' && (
        <Text style={styles.note}>
          Quer refletir com base no que você contou?
        </Text>
      )}
      {r && (
        <Text style={styles.reflection}>
          {r.interpretacao.reflexao ??
            (r.estado === 'NAO_AVALIAVEL'
              ? 'Esta compra ainda não está disponível para reflexão.'
              : 'Ainda falta contexto para uma reflexão. Você pode contar mais quando quiser.')}
        </Text>
      )}
      {r && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: details }}
          onPress={() => setDetails((v) => !v)}
          style={styles.button}
        >
          <Text style={styles.link}>
            {details ? 'Ocultar detalhes' : 'Como chegamos a esta reflexão'}
          </Text>
        </Pressable>
      )}
      {r && details && (
        <>
          <Text style={styles.title}>O que o PLENNA observou</Text>
          {r.observacoes.length ? (
            r.observacoes.map((o, i) => (
              <Text key={i} style={styles.note}>
                {o.mensagem}
              </Text>
            ))
          ) : (
            <Text style={styles.note}>
              Não há observações financeiras disponíveis.
            </Text>
          )}
          <Text style={styles.title}>O que você informou</Text>
          {r.declaracoes.length ? (
            r.declaracoes.map((o, i) => (
              <Text key={i} style={styles.note}>
                {o.mensagem}
              </Text>
            ))
          ) : (
            <Text style={styles.note}>
              Você ainda não informou contexto para esta decisão.
            </Text>
          )}
          {r.autopercepcao && (
            <>
              <Text style={styles.title}>Sua autopercepção</Text>
              <Text style={styles.note}>{r.autopercepcao.mensagem}</Text>
            </>
          )}
          <Text style={styles.title}>Reflexão sugerida</Text>
          <Text style={styles.note}>{r.interpretacao.mensagem}</Text>
          {r.interpretacao.reflexao && (
            <Text style={styles.note}>{r.interpretacao.reflexao}</Text>
          )}
          <Text style={styles.note}>
            Considera somente os registros disponíveis e a referência individual
            atual. Não comprova o limite vigente na compra nem determina
            impulsividade.
          </Text>
        </>
      )}
      {!['loading', 'session', 'conflict'].includes(current.status) && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => service.current.calcular(revisao)}
        >
          <Text style={styles.link}>
            {d?.avaliacaoId ? 'Atualizar reflexão' : 'Gerar reflexão opcional'}
          </Text>
        </Pressable>
      )}
      {current.status === 'error' && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => service.current.consultar()}
        >
          <Text style={styles.link}>Tentar consultar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#EEE4F2', borderRadius: 20, padding: 16, gap: 10 },
  title: { fontSize: 17, fontWeight: '600', color: '#594367' },
  reflection: { fontSize: 17, lineHeight: 25, color: '#594367' },
  note: { fontSize: 14, lineHeight: 21, color: '#655A70' },
  button: { minHeight: 48, justifyContent: 'center' },
  link: { fontSize: 14, fontWeight: '600', color: '#893467' },
});
