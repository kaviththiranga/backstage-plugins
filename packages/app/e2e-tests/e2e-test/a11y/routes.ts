// Route inventory exercised by the accessibility audit (Phase B).
// Each route is visited by axe.spec.ts; one axe scan per entry.
//
// Sample component used for entity tabs. The k3d catalog seed places
// real openchoreo components in team-namespaced locations (team-shop,
// team-data, team-platform). `snip-api-service` was picked because it
// is a `deployment/service` type — exercises the broadest set of
// openchoreo plugin tabs (build, deploy, runtime, metrics, alerts).
// Update if seed data changes.

export const SAMPLE_COMPONENT_PATH =
  '/catalog/team-shop/component/snip-api-service';

export type RouteSpec = {
  // Identifier used in filenames and test titles. Filesystem-safe.
  id: string;
  // URL path (relative to baseURL).
  path: string;
  // Plugin or area the route belongs to. Used for grouping in the report.
  area: string;
  // Optional human description for the audit report.
  description?: string;
};

export const ROUTES: RouteSpec[] = [
  // ---- App shell ----
  { id: 'home', path: '/', area: 'app', description: 'Home page' },
  {
    id: 'catalog',
    path: '/catalog',
    area: 'app',
    description: 'Catalog index (CustomCatalogPage)',
  },
  {
    id: 'api-docs',
    path: '/api-docs',
    area: 'app',
    description: 'API explorer',
  },
  {
    id: 'catalog-import',
    path: '/catalog-import',
    area: 'app',
    description: 'Catalog import',
  },
  { id: 'search', path: '/search', area: 'app', description: 'Search' },
  {
    id: 'create',
    path: '/create',
    area: 'app',
    description: 'Scaffolder template list',
  },
  {
    id: 'catalog-graph',
    path: '/catalog-graph',
    area: 'app',
    description: 'Catalog dependency graph (SVG-heavy)',
  },
  {
    id: 'platform-overview',
    path: '/platform-overview',
    area: 'platform-engineer-core',
    description: 'Platform engineer dashboard',
  },
  {
    id: 'settings-general',
    path: '/settings/general',
    area: 'app',
    description: 'User settings — General',
  },
  {
    id: 'settings-access-control',
    path: '/settings/access-control',
    area: 'app',
    description: 'User settings — Access Control',
  },
  {
    id: 'settings-secrets',
    path: '/settings/secrets',
    area: 'app',
    description: 'User settings — Secrets',
  },

  // ---- Entity tabs (openchoreo + observability + CI plugins) ----
  {
    id: 'entity-overview',
    path: `${SAMPLE_COMPONENT_PATH}`,
    area: 'openchoreo',
    description: 'Component overview tab',
  },
  {
    id: 'entity-definition',
    path: `${SAMPLE_COMPONENT_PATH}/definition`,
    area: 'openchoreo',
    description: 'Component definition tab',
  },
  {
    id: 'entity-workflows',
    path: `${SAMPLE_COMPONENT_PATH}/workflows`,
    area: 'openchoreo-ci',
    description: 'Build / CI workflows tab',
  },
  {
    id: 'entity-environments',
    path: `${SAMPLE_COMPONENT_PATH}/environments`,
    area: 'openchoreo',
    description: 'Deploy view (post-#575: Release vs Deploy split)',
  },
  {
    id: 'entity-runtime-logs',
    path: `${SAMPLE_COMPONENT_PATH}/runtime-logs`,
    area: 'openchoreo-observability',
    description: 'Runtime logs',
  },
  {
    id: 'entity-metrics',
    path: `${SAMPLE_COMPONENT_PATH}/metrics`,
    area: 'openchoreo-observability',
    description: 'Metrics',
  },
  {
    id: 'entity-alerts',
    path: `${SAMPLE_COMPONENT_PATH}/alerts`,
    area: 'openchoreo-observability',
    description: 'Alerts',
  },
];
