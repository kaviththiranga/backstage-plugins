import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  makeStyles,
  Theme,
  Box,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { EntityProvider } from '@backstage/plugin-catalog-react';
// Removed useRouteRef as we'll use direct navigation
import {
  HierarchicalBreadcrumb,
  DynamicSidebar,
  getOrganizationMenuItems,
  getProjectMenuItems,
  getComponentMenuItems,
} from '@openchoreo/backstage-design-system';
import { useEntityHierarchy, useSelectedEntities } from '../../hooks/useEntityHierarchy';
import { HomePageOverview } from './components/HomePageOverview';
import { OrganizationOverview } from './components/OrganizationOverview';
import { ProjectOverview } from './components/ProjectOverview';
import { ComponentOverview } from './components/ComponentOverview';
// Routes will be handled with direct navigation

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    padding: theme.spacing(3),
    overflow: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  errorContainer: {
    padding: theme.spacing(2),
  },
}));

interface RouteParams extends Record<string, string | undefined> {
  orgId?: string;
  projectId?: string;
  componentId?: string;
}

export const HomePage: React.FC = () => {
  const classes = useStyles();
  const params = useParams<RouteParams>();
  const navigate = useNavigate();

  // Get current route info
  const currentPath = window.location.pathname;
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('overview');

  // Build filters from route params
  const filters = useMemo(() => ({
    selectedOrganization: params.orgId,
    selectedProject: params.projectId,
    selectedComponent: params.componentId,
  }), [params.orgId, params.projectId, params.componentId]);

  const hierarchyState = useEntityHierarchy(filters);
  const selectedEntities = useSelectedEntities(filters);

  const { organizations, projects, components, loading, error } = hierarchyState;

  // Redirect to first organization if we're at root and have organizations
  useEffect(() => {
    if (!loading && organizations.length > 0 && currentPath === '/') {
      const firstOrgId = organizations[0].id; // No encoding needed, using clean names
      navigate(`/org/${firstOrgId}/overview`, { replace: true });
    }
  }, [loading, organizations, currentPath, navigate]);

  // Determine current menu item from path
  useEffect(() => {
    if (currentPath.includes('/projects')) {
      setSelectedMenuItem('projects');
    } else if (currentPath.includes('/components')) {
      setSelectedMenuItem('components');
    } else if (currentPath.includes('/builds')) {
      setSelectedMenuItem('builds');
    } else if (currentPath.includes('/deploy')) {
      setSelectedMenuItem('deploy');
    } else if (currentPath.includes('/docs')) {
      setSelectedMenuItem('docs');
    } else if (currentPath.includes('/analytics')) {
      setSelectedMenuItem('analytics');
    } else if (currentPath.includes('/settings')) {
      setSelectedMenuItem('settings');
    } else {
      setSelectedMenuItem('overview');
    }
  }, [currentPath]);

  // Direct navigation paths

  const handleOrganizationChange = (orgId: string | undefined) => {
    if (orgId) {
      navigate(`/org/${orgId}/overview`, { replace: false });
    } else {
      navigate('/', { replace: false });
    }
  };

  const handleProjectChange = (projectId: string | undefined) => {
    if (projectId && params.orgId) {
      navigate(`/org/${params.orgId}/project/${projectId}/overview`, { replace: false });
    } else if (params.orgId) {
      navigate(`/org/${params.orgId}/overview`, { replace: false });
    }
  };

  const handleComponentChange = (componentId: string | undefined) => {
    if (componentId && params.orgId && params.projectId) {
      navigate(`/org/${params.orgId}/project/${params.projectId}/component/${componentId}/overview`, { replace: false });
    } else if (params.orgId && params.projectId) {
      navigate(`/org/${params.orgId}/project/${params.projectId}/overview`, { replace: false });
    }
  };

  const handleMenuItemClick = (itemId: string) => {
    setSelectedMenuItem(itemId);

    if (!params.orgId) {
      return;
    }

    if (params.componentId && params.projectId) {
      // Component level navigation
      navigate(`/org/${params.orgId}/project/${params.projectId}/component/${params.componentId}/${itemId}`);
    } else if (params.projectId) {
      // Project level navigation
      navigate(`/org/${params.orgId}/project/${params.projectId}/${itemId}`);
    } else {
      // Organization level navigation
      navigate(`/org/${params.orgId}/${itemId}`);
    }
  };

  const handleProjectClick = (projectId: string) => {
    if (params.orgId) {
      navigate(`/org/${params.orgId}/project/${projectId}/overview`, { replace: false });
    }
  };

  const handleComponentClick = (componentId: string) => {
    if (params.orgId && params.projectId) {
      navigate(`/org/${params.orgId}/project/${params.projectId}/component/${componentId}/overview`, { replace: false });
    }
  };

  // Determine current level and menu items
  const { menuItems, sidebarTitle } = useMemo(() => {
    if (filters.selectedComponent) {
      return {
        menuItems: getComponentMenuItems(),
        sidebarTitle: selectedEntities.component?.metadata.name || 'Component',
      };
    }
    if (filters.selectedProject) {
      return {
        menuItems: getProjectMenuItems(),
        sidebarTitle: selectedEntities.project?.metadata.name || 'Project',
      };
    }
    if (filters.selectedOrganization) {
      return {
        menuItems: getOrganizationMenuItems(),
        sidebarTitle: selectedEntities.organization?.metadata.name || 'Organization',
      };
    }
    return {
      menuItems: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <span>📊</span>,
          section: 'main',
        },
      ],
      sidebarTitle: 'OpenChoreo Home',
    };
  }, [filters, selectedEntities]);

  // Render main content based on current selection
  const renderMainContent = () => {
    if (loading || selectedEntities.loading) {
      return (
        <Box className={classes.loadingContainer}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box className={classes.errorContainer}>
          <Alert severity="error">
            Failed to load entities: {error.message}
          </Alert>
        </Box>
      );
    }

    if (filters.selectedComponent && selectedEntities.component) {
      return (
        <EntityProvider entity={selectedEntities.component}>
          <ComponentOverview
            component={selectedEntities.component}
            selectedMenuItem={selectedMenuItem}
          />
        </EntityProvider>
      );
    }

    if (filters.selectedProject && selectedEntities.project) {
      return (
        <EntityProvider entity={selectedEntities.project}>
          <ProjectOverview
            project={selectedEntities.project}
            components={components}
            selectedMenuItem={selectedMenuItem}
            onComponentClick={handleComponentClick}
          />
        </EntityProvider>
      );
    }

    if (filters.selectedOrganization && selectedEntities.organization) {
      return (
        <EntityProvider entity={selectedEntities.organization}>
          <OrganizationOverview
            organization={selectedEntities.organization}
            projects={projects}
            selectedMenuItem={selectedMenuItem}
            onProjectClick={handleProjectClick}
          />
        </EntityProvider>
      );
    }

    return (
      <HomePageOverview
        organizations={organizations}
        projects={projects}
        components={components}
        selectedMenuItem={selectedMenuItem}
      />
    );
  };

  // Redirect to first org if we're at root
  if (!loading && organizations.length > 0 && currentPath === '/') {
    const firstOrgId = organizations[0].id; // Clean entity name
    return <Navigate to={`/org/${firstOrgId}/overview`} replace />;
  }

  return (
    <Box className={classes.root}>
      {/* Header with hierarchical navigation */}
      <Box className={classes.header}>
        <Typography variant="h4" gutterBottom>
          OpenChoreo Dashboard
        </Typography>
        <HierarchicalBreadcrumb
          organizations={organizations}
          projects={projects}
          components={components}
          selectedOrganization={filters.selectedOrganization}
          selectedProject={filters.selectedProject}
          selectedComponent={filters.selectedComponent}
          onOrganizationChange={handleOrganizationChange}
          onProjectChange={handleProjectChange}
          onComponentChange={handleComponentChange}
          loading={loading}
        />
      </Box>

      {/* Main content area */}
      <Box className={classes.content}>
        {/* Dynamic sidebar */}
        <DynamicSidebar
          title={sidebarTitle}
          menuItems={menuItems}
          selectedItem={selectedMenuItem}
          onItemClick={handleMenuItemClick}
        />

        {/* Main content */}
        <Box className={classes.mainContent}>
          {renderMainContent()}
        </Box>
      </Box>
    </Box>
  );
};