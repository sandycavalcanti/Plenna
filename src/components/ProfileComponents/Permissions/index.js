import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';
import ProfileCard from '../ProfileCard';
import { apiClient } from '../../../api/client';
import { conectarEmail, consultarConexaoEmail, revogarEmail } from '../../../api/email';
import { CONSENTIMENTO_CODIGOS } from '../../../constants/consentimentos';
import styles from './styles';

const estados = { conectado: 'Gmail conectado', desconectado: 'Gmail não conectado',
  requer_reconexao: 'Gmail precisa de reconexão', tentativa_em_andamento: 'Conexão em andamento' };
export default function Permissions() {
  const [consentimentos, setConsentimentos] = useState([]);
  const [conexao, setConexao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(false);
  const ocupado = useRef(false);
  const sequencia = useRef(0);
  const montado = useRef(true);

  const carregar = useCallback(async () => {
    const atual = ++sequencia.current;
    setLoading(true);
    try {
      const [tipos, salvos, estado] = await Promise.all([
        apiClient.get('/consentimento/tipos'), apiClient.get('/consentimento'), consultarConexaoEmail(),
      ]);
      if (!Array.isArray(tipos.data) || !Array.isArray(salvos.data)) throw new Error('Resposta inválida');
      if (!montado.current || atual !== sequencia.current) return;
      setConsentimentos(tipos.data.map((tipo) => {
        const salvo = salvos.data.find((item) => item.consentimento_tipo_id === tipo.consentimento_tipo_id);
        return { codigo: tipo.consentimento_tipo_codigo, nome: tipo.consentimento_tipo_nome,
          status: tipo.consentimento_tipo_codigo === 'EMAIL' ? estado.autorizacaoEmail : salvo?.consentimento_status ?? false,
          data: salvo?.consentimento_data_criacao };
      }));
      setConexao(estado.conexaoEmail);
      setErro(false);
    } catch {
      if (montado.current && atual === sequencia.current) setErro(true);
    } finally {
      if (montado.current && atual === sequencia.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    montado.current = true;
    carregar();
    return () => { montado.current = false; sequencia.current += 1; };
  }, [carregar]);

  async function executar(acao) {
    if (ocupado.current) return;
    ocupado.current = true;
    setSaving(true);
    sequencia.current += 1;
    try {
      const resultado = await acao();
      if (resultado?.cancelado) Alert.alert('Conexão cancelada', 'Você pode conectar seu e-mail depois.');
    } catch {
      Alert.alert('Confirmação indisponível', 'Não foi possível confirmar a alteração. Atualize para verificar o estado.');
    } finally {
      if (montado.current) await carregar();
      ocupado.current = false;
      if (montado.current) setSaving(false);
    }
  }
  function alterar(item, status) {
    if (ocupado.current || loading) return;
    if (item.codigo === 'TERMOS_USO') return;
    const acao = () => item.codigo === CONSENTIMENTO_CODIGOS.EMAIL
      ? status ? conectarEmail() : revogarEmail()
      : apiClient.post('/consentimento', { consentimentoTipoCodigo: item.codigo, status });
    if (!status) {
      Alert.alert('Revogar autorização', item.codigo === 'EMAIL'
        ? 'A captura de e-mail será desativada e as conexões de e-mail serão removidas. Deseja continuar?'
        : 'Novos dados de tempo de uso não serão coletados. Deseja continuar?', [
        { text: 'Cancelar', style: 'cancel' }, { text: 'Revogar', style: 'destructive', onPress: () => executar(acao) },
      ]);
    } else executar(acao);
  }
  return (
    <ProfileCard title="Permissões">
      {loading && <ActivityIndicator />}
      {erro && <Text style={styles.sub}>Não foi possível atualizar as permissões. O estado exibido pode estar desatualizado.</Text>}
      {consentimentos.map((item) => (
        <View key={item.codigo} style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>{item.codigo === 'EMAIL' ? 'Autorizar captura por e-mail' : item.nome}</Text>
            {item.codigo === 'EMAIL' && <>
              <Text style={styles.sub}>Permitir ao Plenna acessar e-mails para importar compras.</Text>
              <Text style={styles.date}>{estados[conexao] || 'Estado da conexão indisponível'}</Text>
              <Pressable disabled={saving || loading || erro} onPress={() => executar(() => conectarEmail())}>
                <Text style={styles.action}>{conexao === 'conectado' ? 'Conectar outra conta Gmail' : 'Conectar Gmail novamente'}</Text>
              </Pressable>
            </>}
            <Text style={styles.date}>{item.data ? 'Última manifestação: ' + new Date(item.data).toLocaleString('pt-BR') : 'Ainda não informado'}</Text>
          </View>
          <Switch value={item.status} disabled={saving || loading || erro || item.codigo === 'TERMOS_USO'}
            onValueChange={(status) => alterar(item, status)}
            trackColor={{ false: 'rgba(131, 111, 226, 0.25)', true: '#A9A2F1' }}
            thumbColor={item.status ? '#4652A4' : '#F4F3F4'} />
        </View>
      ))}
      {saving && <ActivityIndicator />}
      <Pressable disabled={saving || loading} onPress={carregar}><Text style={styles.action}>Atualizar permissões</Text></Pressable>
      <Text style={styles.warning}>Desativar permissões pode reduzir funcionalidades do app.</Text>
    </ProfileCard>
  );
}
