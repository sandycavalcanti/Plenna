import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProfileCard from '../ProfileCard';
import MetaSummaryCard from '../../Metas/MetaSummaryCard';
import AppEmptyState from '../../Common/AppEmptyState';
import styles from './styles';
import { logApiErrors } from '../../../utils/error';
import { concluirMeta } from '../../../api/metas';
import { confirmarConclusaoMeta } from '../../../utils/confirmarConclusaoMeta';
import { filtrarMetasNaoConcluidas, metaEstaConcluida } from '../../../utils/metasExibicao';

export default function Metas({ metas, error = false, onRetry }) {
  const navigation = useNavigation();
  const [metasVisiveis, setMetasVisiveis] = useState(() => filtrarMetasNaoConcluidas(metas));

  useEffect(() => {
    setMetasVisiveis(filtrarMetasNaoConcluidas(metas));
  }, [metas]);

  function alternarMeta(meta) {
    confirmarConclusaoMeta(meta, () => concluirMeta(meta.meta_id, !metaEstaConcluida(meta))
      .then(() => {
        setMetasVisiveis((current) => current.filter((currentMeta) => currentMeta.meta_id !== meta.meta_id));
      })
      .catch((requestError) => logApiErrors(requestError, 'Erro ao atualizar meta')));
  }

  function abrirMeta(meta) {
    navigation.navigate('MetaDetails', { metaId: meta.meta_id, meta });
  }

  return (
    <ProfileCard
      title="Minhas metas"
      variant="profile"
      actionIcon="pencil-outline"
      actionAccessibilityLabel="Gerenciar metas"
      onEdit={() => navigation.navigate('EditProfile', { mode: 'metas' })}
    >
      {error ? (
        <View style={styles.emptyBody}>
          <AppEmptyState
            icon="alert-circle-outline"
            title="Não foi possível carregar suas metas."
            description="Tente novamente para atualizar este resumo."
            actionLabel="Tentar novamente"
            onAction={onRetry}
            compact
          />
        </View>
      ) : metasVisiveis.length === 0 ? (
        <View style={styles.emptyBody}>
          <AppEmptyState
            icon="target-variant"
            title="Nenhuma meta cadastrada."
            description="Crie uma meta para acompanhar seu progresso."
            actionLabel="Criar meta"
            onAction={() => navigation.navigate('EditProfile', { mode: 'metas' })}
            compact
          />
        </View>
      ) : (
        <View style={styles.list}>
          {metasVisiveis.map((meta) => (
            <MetaSummaryCard
              key={meta.meta_id}
              meta={meta}
              onOpen={abrirMeta}
              onToggleComplete={() => alternarMeta(meta)}
            />
          ))}
        </View>
      )}
    </ProfileCard>
  );
}
