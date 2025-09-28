import { useEffect, useState, useMemo } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { HierarchicalItem } from '@openchoreo/backstage-design-system';

export interface EntityHierarchyState {
  organizations: HierarchicalItem[];
  projects: HierarchicalItem[];
  components: HierarchicalItem[];
  loading: boolean;
  error?: Error;
}

export interface EntityFilters {
  selectedOrganization?: string;
  selectedProject?: string;
  selectedComponent?: string;
}

export const useEntityHierarchy = (filters: EntityFilters = {}) => {
  const catalogApi = useApi(catalogApiRef);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const { selectedOrganization, selectedProject } = filters;

  // Fetch all entities once, not on every filter change
  useEffect(() => {
    let isMounted = true;

    const fetchEntities = async () => {
      try {
        setLoading(true);
        setError(undefined);

        const entitiesResponse = await catalogApi.getEntities({
          filter: {
            kind: ['Domain', 'System', 'Component'],
          },
        });

        if (!isMounted) return;

        setAllEntities(entitiesResponse.items);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchEntities();

    return () => {
      isMounted = false;
    };
  }, [catalogApi]); // Only depend on catalogApi, not filters

  // Memoize derived data to prevent recreation on every render
  const organizations = useMemo(() => {
    const domains = allEntities.filter(entity => entity.kind === 'Domain');
    return domains.map(domain => ({
      id: domain.metadata.name,
      name: domain.metadata.name,
      description: domain.metadata.description,
    }));
  }, [allEntities]);

  const projects = useMemo(() => {
    const domains = allEntities.filter(entity => entity.kind === 'Domain');
    let systems = allEntities.filter(entity => entity.kind === 'System');

    if (selectedOrganization) {
      const selectedDomain = domains.find(d => d.metadata.name === selectedOrganization);
      if (selectedDomain) {
        systems = systems.filter(system =>
          system.spec?.domain === selectedDomain.metadata.name ||
          system.relations?.some(rel =>
            rel.type === 'partOf' &&
            rel.targetRef === stringifyEntityRef(selectedDomain)
          )
        );
      }
    }

    return systems.map(system => ({
      id: system.metadata.name,
      name: system.metadata.name,
      description: system.metadata.description,
    }));
  }, [allEntities, selectedOrganization]);

  const components = useMemo(() => {
    const systems = allEntities.filter(entity => entity.kind === 'System');
    let componentEntities = allEntities.filter(entity => entity.kind === 'Component');

    if (selectedProject) {
      const selectedSystem = systems.find(s => s.metadata.name === selectedProject);
      if (selectedSystem) {
        componentEntities = componentEntities.filter(component =>
          component.spec?.system === selectedSystem.metadata.name ||
          component.relations?.some(rel =>
            rel.type === 'partOf' &&
            rel.targetRef === stringifyEntityRef(selectedSystem)
          )
        );
      }
    }

    return componentEntities.map(component => ({
      id: component.metadata.name,
      name: component.metadata.name,
      description: component.metadata.description,
    }));
  }, [allEntities, selectedProject]);

  return useMemo(() => ({
    organizations,
    projects,
    components,
    loading,
    error,
  }), [organizations, projects, components, loading, error]);
};

export const useSelectedEntities = (filters: EntityFilters) => {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<{
    organization?: Entity;
    project?: Entity;
    component?: Entity;
    loading: boolean;
  }>({ loading: false });

  useEffect(() => {
    let isMounted = true;

    const fetchSelectedEntities = async () => {
      try {
        setEntities(prev => ({ ...prev, loading: true }));

        const promises: Promise<Entity | undefined>[] = [];

        // Fetch selected organization by name
        if (filters.selectedOrganization) {
          promises.push(
            catalogApi.getEntities({
              filter: {
                kind: ['Domain'],
                'metadata.name': filters.selectedOrganization,
              },
            }).then(response => response.items[0]).catch(() => undefined)
          );
        } else {
          promises.push(Promise.resolve(undefined));
        }

        // Fetch selected project by name
        if (filters.selectedProject) {
          promises.push(
            catalogApi.getEntities({
              filter: {
                kind: ['System'],
                'metadata.name': filters.selectedProject,
              },
            }).then(response => response.items[0]).catch(() => undefined)
          );
        } else {
          promises.push(Promise.resolve(undefined));
        }

        // Fetch selected component by name
        if (filters.selectedComponent) {
          promises.push(
            catalogApi.getEntities({
              filter: {
                kind: ['Component'],
                'metadata.name': filters.selectedComponent,
              },
            }).then(response => response.items[0]).catch(() => undefined)
          );
        } else {
          promises.push(Promise.resolve(undefined));
        }

        const [organization, project, component] = await Promise.all(promises);

        if (!isMounted) return;

        setEntities({
          organization,
          project,
          component,
          loading: false,
        });
      } catch (error) {
        if (!isMounted) return;
        setEntities(prev => ({ ...prev, loading: false }));
      }
    };

    if (filters.selectedOrganization || filters.selectedProject || filters.selectedComponent) {
      fetchSelectedEntities();
    } else {
      setEntities({ loading: false });
    }

    return () => {
      isMounted = false;
    };
  }, [catalogApi, filters.selectedOrganization, filters.selectedProject, filters.selectedComponent]);

  return entities;
};