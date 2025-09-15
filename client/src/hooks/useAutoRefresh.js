import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para auto-atualização de dados
 * @param {Function} fetchFunction - Função que busca os dados
 * @param {number} interval - Intervalo em milissegundos (padrão: 5 segundos)
 * @param {boolean} enabled - Se a auto-atualização está habilitada
 * @param {Array} dependencies - Dependências que quando mudam, reiniciam o timer
 */
const useAutoRefresh = (fetchFunction, interval = 5000, enabled = true, dependencies = []) => {
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const startRefresh = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    // Limpar timer existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Executar imediatamente
    fetchFunction();

    // Configurar timer
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && enabled) {
        fetchFunction();
      }
    }, interval);
  }, [fetchFunction, interval, enabled, ...dependencies]);

  const stopRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (enabled) {
      startRefresh();
    } else {
      stopRefresh();
    }

    return () => {
      isMountedRef.current = false;
      stopRefresh();
    };
  }, [enabled, startRefresh, stopRefresh]);

  // Reiniciar quando dependências mudarem
  useEffect(() => {
    if (enabled) {
      startRefresh();
    }
  }, dependencies);

  return { startRefresh, stopRefresh };
};

export default useAutoRefresh;
