import { useCallback, useEffect, useState } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { InfoCard } from '@backstage/core-components';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Skeleton } from '@material-ui/lab';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
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
  summaryBar: {
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.02)',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  summaryCount: {
    fontWeight: 600,
    fontSize: '1.1rem',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
  statusIcon: {
    fontSize: '1.1rem',
    verticalAlign: 'middle',
  },
  pending: {
    color: theme.palette.warning?.main || '#ff9800',
  },
  completed: {
    color: theme.palette.success?.main || '#4caf50',
  },
  failed: {
    color: theme.palette.error.main,
  },
  alertId: {
    fontWeight: 500,
    fontSize: '0.85rem',
  },
  timestamp: {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
  },
  summary: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
    maxWidth: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  chip: {
    height: 20,
    fontSize: '0.7rem',
  },
  tableRow: {
    '&:last-child td': {
      borderBottom: 'none',
    },
  },
}));

interface RCAReport {
  alertId: string;
  reportId: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  summary?: string | null;
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function getStatusIcon(status: string, classes: ReturnType<typeof useStyles>) {
  switch (status) {
    case 'completed':
      return (
        <CheckCircleIcon
          className={`${classes.statusIcon} ${classes.completed}`}
        />
      );
    case 'failed':
      return (
        <ErrorIcon className={`${classes.statusIcon} ${classes.failed}`} />
      );
    case 'pending':
    default:
      return (
        <HourglassEmptyIcon
          className={`${classes.statusIcon} ${classes.pending}`}
        />
      );
  }
}

function getChipColor(status: string): 'default' | 'primary' | 'secondary' {
  if (status === 'completed') return 'primary';
  if (status === 'failed') return 'secondary';
  return 'default';
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

export const ActiveAlertsWidget = () => {
  const classes = useStyles();
  const [reports, setReports] = useState<RCAReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const catalogApi = useApi(catalogApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all projects (systems) and environments
      const [
        { items: systems },
        { items: envEntities },
        { items: componentEntities },
      ] = await Promise.all([
        catalogApi.getEntities({ filter: { kind: 'System' } }),
        catalogApi.getEntities({ filter: { kind: 'Environment' } }),
        catalogApi.getEntities({ filter: { kind: 'Component' } }),
      ]);

      if (systems.length === 0) {
        setReports([]);
        return;
      }

      // Build environment lookup by namespace
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

      // Build component UIDs by project
      const componentUidsByProject = new Map<string, string[]>();
      for (const comp of componentEntities) {
        const projectName =
          comp.metadata.annotations?.[CHOREO_ANNOTATIONS.PROJECT];
        const compUid =
          comp.metadata.annotations?.[CHOREO_ANNOTATIONS.COMPONENT_UID] ||
          comp.metadata.uid ||
          '';
        if (projectName && compUid) {
          const existing = componentUidsByProject.get(projectName) || [];
          existing.push(compUid);
          componentUidsByProject.set(projectName, existing);
        }
      }

      const obsBaseUrl = await discoveryApi.getBaseUrl(
        'openchoreo-observability-backend',
      );

      // Time range: last 24 hours
      const endTime = new Date().toISOString();
      const startTime = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const allReports: RCAReport[] = [];

      // Fetch RCA reports per project
      await Promise.all(
        systems.slice(0, 5).map(async system => {
          const projectName = system.metadata.name;
          const namespaceName =
            system.metadata.annotations?.[CHOREO_ANNOTATIONS.NAMESPACE];

          if (!namespaceName) return;

          const envInfo = envByNamespace.get(namespaceName);
          if (!envInfo) return;

          try {
            const projectId = await getProjectUid(
              projectName,
              namespaceName,
              discoveryApi,
              fetchApi,
            );

            if (!projectId) return;

            const componentUids = componentUidsByProject.get(projectName) || [];

            const response = await fetchApi.fetch(`${obsBaseUrl}/rca-reports`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                environmentId: envInfo.uid,
                environmentName: envInfo.name,
                namespaceName,
                projectName,
                componentUids,
                options: {
                  startTime,
                  endTime,
                  limit: 10,
                },
              }),
            });

            if (!response.ok) return;

            const data = await response.json();

            if (data.reports && Array.isArray(data.reports)) {
              for (const report of data.reports) {
                allReports.push({
                  alertId: report.alertId,
                  reportId: report.reportId,
                  status: report.status,
                  timestamp: report.timestamp,
                  summary: report.summary,
                });
              }
            }
          } catch {
            // Skip project on error (RCA not configured, etc.)
          }
        }),
      );

      // Sort by timestamp descending (newest first)
      allReports.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setReports(allReports.slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [catalogApi, discoveryApi, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const title = (
    <Box display="flex" alignItems="center">
      <NotificationsActiveIcon className={classes.headerIcon} />
      <Typography variant="h6">Active Alerts & RCA</Typography>
    </Box>
  );

  if (loading) {
    return (
      <InfoCard title={title}>
        {[...Array(3)].map((_, i) => (
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

  if (reports.length === 0) {
    return (
      <InfoCard title={title}>
        <Box className={classes.emptyState}>
          <Typography>No alerts in the last 24 hours</Typography>
        </Box>
      </InfoCard>
    );
  }

  // Summary counts
  const pendingCt = reports.filter(r => r.status === 'pending').length;
  const completedCt = reports.filter(r => r.status === 'completed').length;
  const failedCt = reports.filter(r => r.status === 'failed').length;

  return (
    <InfoCard title={title}>
      {/* Summary bar */}
      <Box className={classes.summaryBar}>
        <Box className={classes.summaryItem}>
          <HourglassEmptyIcon
            className={`${classes.statusIcon} ${classes.pending}`}
          />
          <Typography className={classes.summaryCount}>{pendingCt}</Typography>
          <Typography className={classes.summaryLabel}>Pending</Typography>
        </Box>
        <Box className={classes.summaryItem}>
          <CheckCircleIcon
            className={`${classes.statusIcon} ${classes.completed}`}
          />
          <Typography className={classes.summaryCount}>
            {completedCt}
          </Typography>
          <Typography className={classes.summaryLabel}>Resolved</Typography>
        </Box>
        <Box className={classes.summaryItem}>
          <ErrorIcon className={`${classes.statusIcon} ${classes.failed}`} />
          <Typography className={classes.summaryCount}>{failedCt}</Typography>
          <Typography className={classes.summaryLabel}>Failed</Typography>
        </Box>
      </Box>

      {/* Reports table */}
      <Table size="small">
        <TableBody>
          {reports.map(report => (
            <TableRow key={report.reportId} className={classes.tableRow}>
              <TableCell padding="none" style={{ width: 28 }}>
                {getStatusIcon(report.status, classes)}
              </TableCell>
              <TableCell>
                <Typography className={classes.alertId}>
                  {report.alertId}
                </Typography>
                {report.summary && (
                  <Typography className={classes.summary}>
                    {report.summary}
                  </Typography>
                )}
                <Typography className={classes.timestamp}>
                  {formatTimeAgo(report.timestamp)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={report.status}
                  color={getChipColor(report.status)}
                  size="small"
                  className={classes.chip}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </InfoCard>
  );
};
