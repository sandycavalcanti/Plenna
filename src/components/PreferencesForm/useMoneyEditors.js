import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Espera o commit do React entre campos: callbacks passam a ler os valores confirmados.
export default function useMoneyEditors({ canConfirm = () => true } = {}) {
  const editors = useRef(new Set());
  const waiters = useRef([]);
  const pending = useRef(null);
  const mounted = useRef(true);
  const confirmationAllowed = useRef(canConfirm);
  confirmationAllowed.current = canConfirm;
  const [, render] = useState(0);

  useLayoutEffect(() => {
    const current = waiters.current.splice(0);
    current.forEach((resolve) => resolve(true));
  });
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      waiters.current.splice(0).forEach((resolve) => resolve(false));
    };
  }, []);

  const registerEditor = useCallback((commit) => {
    editors.current.add(commit);
    return () => editors.current.delete(commit);
  }, []);

  const confirmEdits = useCallback(() => {
    if (pending.current) return pending.current;
    const afterRender = () => new Promise((resolve) => {
      if (!mounted.current) return resolve(false);
      waiters.current.push(resolve);
      render((version) => version + 1);
    });
    pending.current = (async () => {
      // Inclui atualizações disparadas por um blur anterior ao toque na ação.
      if (!await afterRender()) return false;
      for (const commit of editors.current) {
        if (!mounted.current || !confirmationAllowed.current()) return false;
        const result = commit();
        if (!result.ok) return false;
        if (result.changed && !await afterRender()) return false;
      }
      return mounted.current;
    })().finally(() => { pending.current = null; });
    return pending.current;
  }, []);

  return { registerEditor, confirmEdits };
}
