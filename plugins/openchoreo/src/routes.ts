import { createRouteRef } from '@backstage/core-plugin-api';

// Existing routes
export const rootCatalogEnvironmentRouteRef = createRouteRef({
  id: 'deploy',
});
export const rootCatalogCellDiagramRouteRef = createRouteRef({
  id: 'cell-diagram',
});
export const rootCatalogRuntimeLogsRouteRef = createRouteRef({
  id: 'runtime-logs',
});

// New hierarchical navigation routes - simplified to use just createRouteRef
export const homeRouteRef = createRouteRef({
  id: 'openchoreo-home',
});
