import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  InfoCard,
  StatusError,
  StatusOK,
  StatusPending,
  StatusRunning,
  Link,
} from '@backstage/core-components';
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
import BuildIcon from '@material-ui/icons/Build';
import { CHOREO_ANNOTATIONS } from '@openchoreo/backstage-plugin-common';
import { openChoreoClientApiRef } from '../../../api/OpenChoreoClientApi';

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
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  componentName: {
    fontWeight: 500,
  },
  timestamp: {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
  },
  tableRow: {
    '&:last-child td': {
      borderBottom: 'none',
    },
  },
  chip: {
    height: 20,
    fontSize: '0.7rem',
  },
}));

interface BuildEntry {
  name: string;
  componentName: string;
  projectName: string;
  status: string;
  createdAt: string;
}

const MAX_BUILDS = 8;

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s.includes('success') || s.includes('complete')) return StatusOK;
  if (s.includes('fail') || s.includes('error')) return StatusError;
  if (s.includes('running') || s.includes('progress')) return StatusRunning;
  return StatusPending;
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

function getStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('success') || s.includes('complete')) return 'Succeeded';
  if (s.includes('fail')) return 'Failed';
  if (s.includes('error')) return 'Error';
  if (s.includes('running') || s.includes('progress')) return 'Running';
  if (s.includes('pending') || s.includes('queued')) return 'Pending';
  return status;
}

function getStatusColor(status: string): 'default' | 'primary' | 'secondary' {
  const s = status.toLowerCase();
  if (s.includes('success') || s.includes('complete')) return 'primary';
  if (s.includes('fail') || s.includes('error')) return 'secondary';
  return 'default';
}

export const LatestBuildsWidget = () => {
  const classes = useStyles();
  const [builds, setBuilds] = useState<BuildEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const catalogApi = useApi(catalogApiRef);
  const client = useApi(openChoreoClientApiRef);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { items: components } = await catalogApi.getEntities({
        filter: { kind: 'Component' },
      });

      const allBuilds: BuildEntry[] = [];

      await Promise.all(
        components.map(async component => {
          const annotations = component.metadata.annotations || {};
          const namespaceName = annotations[CHOREO_ANNOTATIONS.NAMESPACE];
          const projectName = annotations[CHOREO_ANNOTATIONS.PROJECT];
          const componentName = annotations[CHOREO_ANNOTATIONS.COMPONENT];

          if (!namespaceName || !projectName || !componentName) return;

          try {
            const buildsData = await client.fetchBuilds(
              componentName,
              projectName,
              namespaceName,
            );

            if (Array.isArray(buildsData)) {
              for (const build of buildsData.slice(0, 3)) {
                allBuilds.push({
                  name: build.name || '',
                  componentName,
                  projectName,
                  status: build.status || 'Unknown',
                  createdAt: build.createdAt || '',
                });
              }
            }
          } catch {
            // Skip component on error
          }
        }),
      );

      allBuilds.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setBuilds(allBuilds.slice(0, MAX_BUILDS));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch build data',
      );
    } finally {
      setLoading(false);
    }
  }, [catalogApi, client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const title = (
    <Box display="flex" alignItems="center">
      <BuildIcon className={classes.headerIcon} />
      <Typography variant="h6">Latest Builds</Typography>
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

  if (builds.length === 0) {
    return (
      <InfoCard title={title}>
        <Box className={classes.emptyState}>
          <Typography>No builds found</Typography>
        </Box>
      </InfoCard>
    );
  }

  return (
    <InfoCard title={title}>
      <Table size="small">
        <TableBody>
          {builds.map(build => {
            const StatusIcon = getStatusIcon(build.status);
            return (
              <TableRow key={build.name} className={classes.tableRow}>
                <TableCell padding="none" style={{ width: 28 }}>
                  <StatusIcon />
                </TableCell>
                <TableCell>
                  <Link
                    to={`/catalog/default/component/${build.componentName}`}
                  >
                    <Typography
                      variant="body2"
                      className={classes.componentName}
                    >
                      {build.componentName}
                    </Typography>
                  </Link>
                  <Typography className={classes.timestamp}>
                    {formatTimeAgo(build.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={getStatusLabel(build.status)}
                    color={getStatusColor(build.status)}
                    size="small"
                    className={classes.chip}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </InfoCard>
  );
};
