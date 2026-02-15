import { useCallback, useEffect, useState } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { InfoCard, Link } from '@backstage/core-components';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Skeleton } from '@material-ui/lab';
import SpeedIcon from '@material-ui/icons/Speed';
import { CHOREO_ANNOTATIONS } from '@openchoreo/backstage-plugin-common';

const useStyles = makeStyles(theme => ({
  headerIcon: {
    fontSize: '1.25rem',
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  componentName: {
    fontWeight: 500,
  },
  metricValue: {
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  good: {
    color: theme.palette.success?.main || '#4caf50',
  },
  warning: {
    color: theme.palette.warning?.main || '#ff9800',
  },
  bad: {
    color: theme.palette.error.main,
  },
  muted: {
    color: theme.palette.text.disabled,
  },
  headerCell: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: theme.palette.text.secondary,
  },
  tableRow: {
    '&:last-child td': {
      borderBottom: 'none',
    },
  },
  noDataText: {
    color: theme.palette.text.disabled,
    fontSize: '0.8rem',
  },
}));

interface ComponentMetricsSummary {
  componentName: string;
  throughput: number | null; // req/s
  errorRate: number | null; // percentage
  p50Latency: number | null; // ms
  p99Latency: number | null; // ms
}

function formatThroughput(value: number | null): string {
  if (value === null) return '-';
  if (value < 0.01) return '<0.01';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(1);
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1) return '<1ms';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatErrorRate(rate: number | null): string {
  if (rate === null) return '-';
  if (rate === 0) return '0%';
  if (rate < 0.1) return '<0.1%';
  return `${rate.toFixed(1)}%`;
}

function getErrorRateClass(
  rate: number | null,
  classes: ReturnType<typeof useStyles>,
): string {
  if (rate === null) return classes.muted;
  if (rate === 0) return classes.good;
  if (rate < 5) return classes.warning;
  return classes.bad;
}

function getLatencyClass(
  ms: number | null,
  classes: ReturnType<typeof useStyles>,
): string {
  if (ms === null) return classes.muted;
  if (ms < 100) return classes.good;
  if (ms < 500) return classes.warning;
  return classes.bad;
}

/** Compute the average of the last N data points, or all if fewer */
function avgLast(points: Array<{ value: number }>, n = 5): number | null {
  if (!points || points.length === 0) return null;
  const tail = points.slice(-n);
  const sum = tail.reduce((acc, p) => acc + p.value, 0);
  return sum / tail.length;
}

async function getComponentUid(
  componentName: string,
  projectName: string,
  namespaceName: string,
  discoveryApi: any,
  fetchApi: any,
): Promise<string | null> {
  try {
    const backendUrl = new URL(
      `${await discoveryApi.getBaseUrl('openchoreo')}/component`,
    );
    backendUrl.search = new URLSearchParams({
      componentName,
      projectName,
      namespaceName,
    }).toString();
    const response = await fetchApi.fetch(backendUrl.toString());
    if (!response.ok) return null;
    const data = await response.json();
    return data.uid || null;
  } catch {
    return null;
  }
}

async function getProjectUid(
  projectName: string,
  namespaceName: string,
  discoveryApi: any,
  fetchApi: any,
): Promise<string | null> {
  try {
    const backendUrl = new URL(
      `${await discoveryApi.getBaseUrl('openchoreo')}/project`,
    );
    backendUrl.search = new URLSearchParams({
      projectName,
      namespaceName,
    }).toString();
    const response = await fetchApi.fetch(backendUrl.toString());
    if (!response.ok) return null;
    const data = await response.json();
    return data.uid || null;
  } catch {
    return null;
  }
}

export const HttpMetricsWidget = () => {
  const classes = useStyles();
  const [components, setComponents] = useState<ComponentMetricsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const catalogApi = useApi(catalogApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all components and environments
      const [{ items: componentEntities }, { items: envEntities }] =
        await Promise.all([
          catalogApi.getEntities({ filter: { kind: 'Component' } }),
          catalogApi.getEntities({ filter: { kind: 'Environment' } }),
        ]);

      if (componentEntities.length === 0) {
        setComponents([]);
        return;
      }

      // Pick the first environment per namespace
      const envByNamespace = new Map<string, { name: string; uid: string }>();
      for (const env of envEntities) {
        const ns = env.metadata.annotations?.[CHOREO_ANNOTATIONS.NAMESPACE];
        const envName =
          env.metadata.annotations?.[CHOREO_ANNOTATIONS.ENVIRONMENT] ||
          env.metadata.name;
        const envUid =
          env.metadata.annotations?.[CHOREO_ANNOTATIONS.ENVIRONMENT_UID] ||
          env.metadata.uid ||
          '';
        if (ns && !envByNamespace.has(ns)) {
          envByNamespace.set(ns, { name: envName, uid: envUid });
        }
      }

      const obsBaseUrl = await discoveryApi.getBaseUrl(
        'openchoreo-observability-backend',
      );

      // Time range: last 1 hour
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const results: ComponentMetricsSummary[] = [];

      // Process components in batches to avoid overwhelming the backend
      const MAX_COMPONENTS = 10;
      const toProcess = componentEntities.slice(0, MAX_COMPONENTS);

      await Promise.all(
        toProcess.map(async entity => {
          const annotations = entity.metadata.annotations || {};
          const componentName = annotations[CHOREO_ANNOTATIONS.COMPONENT];
          const projectName = annotations[CHOREO_ANNOTATIONS.PROJECT];
          const namespaceName = annotations[CHOREO_ANNOTATIONS.NAMESPACE];

          if (!componentName || !projectName || !namespaceName) return;

          const envInfo = envByNamespace.get(namespaceName);
          if (!envInfo) return;

          try {
            // Resolve component and project UIDs
            const [componentId, projectId] = await Promise.all([
              getComponentUid(
                componentName,
                projectName,
                namespaceName,
                discoveryApi,
                fetchApi,
              ),
              getProjectUid(projectName, namespaceName, discoveryApi, fetchApi),
            ]);

            if (!componentId || !projectId) return;

            const response = await fetchApi.fetch(`${obsBaseUrl}/metrics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                componentId,
                projectId,
                environmentId: envInfo.uid,
                environmentName: envInfo.name,
                componentName,
                namespaceName,
                projectName,
                options: { startTime, endTime },
              }),
            });

            if (!response.ok) return;

            const data = await response.json();

            // Compute summary metrics from time series
            const throughput = avgLast(data.requestCount);
            const successCount = avgLast(data.successfulRequestCount);
            const totalCount = avgLast(data.requestCount);

            let errorRate: number | null = null;
            if (
              totalCount !== null &&
              totalCount > 0 &&
              successCount !== null
            ) {
              errorRate = ((totalCount - successCount) / totalCount) * 100;
            } else if (totalCount === 0 || totalCount === null) {
              errorRate = null;
            }

            // Latency is in seconds from API, convert to ms
            const p50Raw = avgLast(data.latencyPercentile50th);
            const p99Raw = avgLast(data.latencyPercentile99th);

            results.push({
              componentName,
              throughput,
              errorRate,
              p50Latency: p50Raw !== null ? p50Raw * 1000 : null,
              p99Latency: p99Raw !== null ? p99Raw * 1000 : null,
            });
          } catch {
            // Skip component on error (observability not configured, etc.)
          }
        }),
      );

      // Sort by throughput descending (busiest first)
      results.sort((a, b) => (b.throughput ?? -1) - (a.throughput ?? -1));

      setComponents(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [catalogApi, discoveryApi, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const title = (
    <Box display="flex" alignItems="center">
      <SpeedIcon className={classes.headerIcon} />
      <Typography variant="h6">HTTP Metrics (1h)</Typography>
    </Box>
  );

  if (loading) {
    return (
      <InfoCard title={title}>
        {[...Array(4)].map((_, i) => (
          <Box key={i} mb={1}>
            <Skeleton variant="rect" height={32} />
          </Box>
        ))}
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title={title}>
        <Box className={classes.emptyState}>
          <Typography color="error">{error}</Typography>
        </Box>
      </InfoCard>
    );
  }

  if (components.length === 0) {
    return (
      <InfoCard title={title}>
        <Box className={classes.emptyState}>
          <Typography>
            No HTTP metrics available. Observability may not be configured.
          </Typography>
        </Box>
      </InfoCard>
    );
  }

  return (
    <InfoCard title={title}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell className={classes.headerCell}>Component</TableCell>
            <TableCell className={classes.headerCell} align="right">
              <Tooltip title="Requests per second" arrow>
                <span>Req/s</span>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.headerCell} align="right">
              <Tooltip title="Error rate (non-2xx responses)" arrow>
                <span>Errors</span>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.headerCell} align="right">
              <Tooltip title="50th percentile latency" arrow>
                <span>P50</span>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.headerCell} align="right">
              <Tooltip title="99th percentile latency" arrow>
                <span>P99</span>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {components.map(comp => (
            <TableRow key={comp.componentName} className={classes.tableRow}>
              <TableCell>
                <Link to={`/catalog/default/component/${comp.componentName}`}>
                  <Typography variant="body2" className={classes.componentName}>
                    {comp.componentName}
                  </Typography>
                </Link>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" className={classes.metricValue}>
                  {formatThroughput(comp.throughput)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  className={`${classes.metricValue} ${getErrorRateClass(
                    comp.errorRate,
                    classes,
                  )}`}
                >
                  {formatErrorRate(comp.errorRate)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  className={`${classes.metricValue} ${getLatencyClass(
                    comp.p50Latency,
                    classes,
                  )}`}
                >
                  {formatLatency(comp.p50Latency)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  className={`${classes.metricValue} ${getLatencyClass(
                    comp.p99Latency,
                    classes,
                  )}`}
                >
                  {formatLatency(comp.p99Latency)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </InfoCard>
  );
};
