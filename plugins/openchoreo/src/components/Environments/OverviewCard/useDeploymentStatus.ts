import { useCallback, useEffect, useRef, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { openChoreoClientApiRef } from '../../../api/OpenChoreoClientApi';
import { isForbiddenError } from '../../../utils/errorUtils';
import type { Environment } from '../hooks/useEnvironmentData';

interface DeploymentStatusState {
  environments: Environment[];
  loading: boolean;
  error: Error | null;
  isForbidden: boolean;
  refreshing: boolean;
}

function hasNotReadyEnv(environments: Environment[]): boolean {
  return environments.some(env => env.deployment?.status === 'NotReady');
}

/**
 * Hook for fetching deployment status across all environments for the overview card.
 */
export function useDeploymentStatus() {
  const { entity } = useEntity();
  const client = useApi(openChoreoClientApiRef);

  const [state, setState] = useState<DeploymentStatusState>({
    environments: [],
    loading: true,
    error: null,
    isForbidden: false,
    refreshing: false,
  });

  const shouldPollRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const environments = (await client.fetchEnvironmentInfo(
        entity,
      )) as Environment[];

      shouldPollRef.current = hasNotReadyEnv(environments);

      setState(prev => {
        const statusKey = (envs: Environment[]) =>
          envs.map(e => `${e.name}:${e.deployment?.status ?? ''}`).join(',');

        if (
          !prev.loading &&
          !prev.error &&
          statusKey(prev.environments) === statusKey(environments)
        ) {
          return prev;
        }

        return {
          ...prev,
          environments,
          loading: false,
          error: null,
        };
      });
    } catch (err) {
      shouldPollRef.current = false;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err as Error,
        isForbidden: isForbiddenError(err),
      }));
    }
  }, [entity, client]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    try {
      await fetchData();
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll if any environment has NotReady status
  useEffect(() => {
    if (!shouldPollRef.current) return undefined;

    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(intervalId);
    // Re-evaluate polling when environments change (new reference = data changed)
  }, [state.environments, fetchData]);

  return {
    environments: state.environments,
    loading: state.loading,
    error: state.error,
    isForbidden: state.isForbidden,
    refreshing: state.refreshing,
    refresh,
  };
}
