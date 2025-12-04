import { ReactNode, FC, createContext, useContext, useMemo } from 'react';
import {
  ModelsBuild,
  ModelsWorkload,
} from '@openchoreo/backstage-plugin-common';
import {
  useWorkloadChanges,
  type WorkloadChanges,
} from './hooks/useWorkloadChanges';

export type WorkloadTabId = 'containers' | 'endpoints' | 'connections';

interface WorkloadContextType {
  builds: ModelsBuild[];
  workloadSpec: ModelsWorkload | null;
  setWorkloadSpec: (spec: ModelsWorkload | null) => void;
  isDeploying: boolean;
  /** Initial workload data for change comparison */
  initialWorkload: ModelsWorkload | null;
  /** Detected changes between initial and current workload */
  changes: WorkloadChanges;
  /** Currently active tab in workload editor */
  activeTab: WorkloadTabId;
  /** Set the active tab in workload editor */
  setActiveTab: (tab: WorkloadTabId) => void;
}

const WorkloadContext = createContext<WorkloadContextType | undefined>(
  undefined,
);

export const WorkloadProvider: FC<{
  builds: ModelsBuild[];
  workloadSpec: ModelsWorkload | null;
  setWorkloadSpec: (spec: ModelsWorkload | null) => void;
  children: ReactNode;
  isDeploying: boolean;
  /** Initial workload data for change comparison */
  initialWorkload?: ModelsWorkload | null;
  /** Currently active tab in workload editor */
  activeTab: WorkloadTabId;
  /** Set the active tab in workload editor */
  setActiveTab: (tab: WorkloadTabId) => void;
}> = ({
  builds,
  workloadSpec,
  setWorkloadSpec,
  children,
  isDeploying,
  initialWorkload = null,
  activeTab,
  setActiveTab,
}) => {
  // Calculate changes between initial and current workload
  const changes = useWorkloadChanges(initialWorkload, workloadSpec);

  const value = useMemo(
    () => ({
      builds,
      workloadSpec,
      setWorkloadSpec,
      isDeploying,
      initialWorkload,
      changes,
      activeTab,
      setActiveTab,
    }),
    [
      builds,
      workloadSpec,
      setWorkloadSpec,
      isDeploying,
      initialWorkload,
      changes,
      activeTab,
      setActiveTab,
    ],
  );

  return (
    <WorkloadContext.Provider value={value}>
      {children}
    </WorkloadContext.Provider>
  );
};

export const useWorkloadContext = (): WorkloadContextType => {
  const context = useContext(WorkloadContext);
  if (context === undefined) {
    throw new Error(
      'useWorkloadContext must be used within a WorkloadProvider',
    );
  }
  return context;
};

export const useIsDeploying = () => {
  const { isDeploying } = useWorkloadContext();
  return isDeploying;
};

// Keep backwards compatibility
export const useBuilds = () => {
  const { builds } = useWorkloadContext();
  return { builds };
};

/**
 * Hook to get workload changes from context
 */
export const useWorkloadChangesContext = (): WorkloadChanges => {
  const { changes } = useWorkloadContext();
  return changes;
};

/**
 * Hook to get and set active tab from context
 */
export const useActiveTab = () => {
  const { activeTab, setActiveTab } = useWorkloadContext();
  return { activeTab, setActiveTab };
};
