import React from 'react';
import { View, Text } from 'react-native';
import ProfileCard from '../ProfileComponents/ProfileCard';
export default function MovimentacoesCompra({ eventos: e }) {
  if (
    !e?.disponivel ||
    !(
      e.cancelamentos ||
      e.devolucoes ||
      e.reembolsadoCentavos ||
      e.reembolsosSemData
    )
  )
    return null;
  return (
    <ProfileCard title="Eventos registrados" variant="dashboard">
      <View style={{ gap: 8 }}>
        <Text style={{ color: '#594367' }}>
          {e.cancelamentos} compra(s) com cancelamento · {e.devolucoes} com
          devolução
        </Text>
        <Text style={{ fontSize: 12, color: '#655A70' }}>
          Compras do período; decisões originais preservadas.
        </Text>
        <Text style={{ fontWeight: '600', color: '#594367' }}>
          Reembolsos datados no mês:{' '}
          {(e.reembolsadoCentavos / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </Text>
        {e.reembolsosSemData > 0 && (
          <Text style={{ fontSize: 12, color: '#655A70' }}>
            {e.reembolsosSemData} reembolso(s) sem data ficam fora do total
            mensal.
          </Text>
        )}
        <Text style={{ fontSize: 12, color: '#655A70' }}>
          Os gastos originais permanecem separados. Cancelar ou devolver não
          significa receber reembolso.
        </Text>
      </View>
    </ProfileCard>
  );
}
