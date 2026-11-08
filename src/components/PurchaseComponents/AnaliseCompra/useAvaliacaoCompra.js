import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarConsultaAvaliacao } from '../../../services/avaliacaoCompraService';
export function useAvaliacaoCompra({
  compraId,
  revisao,
  refreshKey,
  active
}) {
  const [state, setState] = useState({
    status: 'loading',
    dados: null
  });
  const service = useRef(null),
    start = useRef(null),
    visible = useRef(active);
  visible.current = active;
  useEffect(() => {
    let mounted = true;
    const iniciar = () => {
      if (!mounted || service.current) return;
      const instance = criarConsultaAvaliacao({
        compraId,
        client: apiClient,
        storage: tokenStorage,
        onChange: next => {
          if (mounted) setState({
            ...next,
            compraId,
            revisao
          });
        }
      });
      service.current = instance;
      instance.consultar();
    };
    setState({
      status: 'loading',
      dados: null
    });
    start.current = iniciar;
    if (visible.current) iniciar();
    const listener = AppState?.addEventListener('change', next => {
      if (next === 'active') {
        if (visible.current) iniciar();
      } else {
        service.current?.dispose();
        service.current = null;
        setState({
          status: 'loading',
          dados: null
        });
      }
    });
    return () => {
      mounted = false;
      listener?.remove();
      service.current?.dispose();
      service.current = null;
      start.current = null;
    };
  }, [compraId, revisao, refreshKey]);
  useEffect(() => {
    if (active) start.current?.();
  }, [active]);
  return {
    state: state.compraId === compraId && state.revisao === revisao ? state : {
      status: 'loading',
      dados: null
    },
    consultar: () => service.current?.consultar(),
    calcular: () => {
      if (Number.isInteger(revisao)) service.current?.calcular(revisao);
    }
  };
}
