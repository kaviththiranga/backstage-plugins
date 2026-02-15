import { useCallback, useEffect, useState } from 'react';
import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { InfoCard, Link } from '@backstage/core-components';
import {
  Box,
  Button,
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
import DashboardIcon from '@material-ui/icons/Dashboard';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
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
  statusIcon: {
    fontSize: '1rem',
  },
  ready: {
    color: theme.palette.success?.main || '#4caf50',
  },
  failed: {
    color: theme.palette.error.main,
  },
  warning: {
    color: theme.palette.warning?.main || '#ff9800',
  },
  pending: {
    color: theme.palette.text.disabled,
  },
  notDeployed: {
    color: theme.palette.text.disabled,
  },
  componentName: {
    fontWeight: 500,
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  envHeader: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  statusCell: {
    textAlign: 'center' as const,
  },
  tableRow: {
    '&:last-child td': {
      borderBottom: 'none',
    },
  },
  showMoreButton: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1),
  },
}));

const DEFAULT_ROWS = 5;

interface EnvironmentStatus {
  status: string;
  isDeployed: boolean;
}

interface ComponentRow {
  name: string;
  projectName: string;
  environments: Record<string, EnvironmentStatus>;
}

function getStatusIcon(
  envStatus: EnvironmentStatus | undefined,
  classes: ReturnType<typeof useStyles>,
) {
  if (!envStatus || !envStatus.isDeployed) {
    return (
      <Tooltip title="Not Deployed" arrow>
        <RemoveCircleOutlineIcon
          className={`${classes.statusIcon} ${classes.notDeployed}`}
        />
      </Tooltip>
    );
  }

  const s = envStatus.status?.toLowerCase() || '';

  if (s.includes('ready') || s.includes('active')) {
    return (
      <Tooltip title="Ready" arrow>
        <CheckCircleIcon className={`${classes.statusIcon} ${classes.ready}`} />
      </Tooltip>
    );
  }
  if (s.includes('fail') || s.includes('error')) {
    return (
      <Tooltip title="Failed" arrow>
        <ErrorIcon className={`${classes.statusIcon} ${classes.failed}`} />
      </Tooltip>
    );
  }
  if (s.includes('progress') || s.includes('pending')) {
    return (
      <Tooltip title="In Progress" arrow>
        <HourglassEmptyIcon
          className={`${classes.statusIcon} ${classes.pending}`}
        />
      </Tooltip>
    );
  }
  if (s.includes('notready') || s.includes('degraded')) {
    return (
      <Tooltip title="Not Ready" arrow>
        <WarningIcon className={`${classes.statusIcon} ${classes.warning}`} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={envStatus.status || 'Unknown'} arrow>
      <HourglassEmptyIcon
        className={`${classes.statusIcon} ${classes.pending}`}
      />
    </Tooltip>
  );
}

export const DeploymentStatusWidget = () => {
  const classes = useStyles();
  const [rows, setRows] = useState<ComponentRow[]>([]);
  const [environmentNames, setEnvironmentNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const catalogApi = useApi(catalogApiRef);
  const client = useApi(openChoreoClientApiRef);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all environment entities to get the column headers
      const [{ items: envEntities }, { items: components }] = await Promise.all(
        [
          catalogApi.getEntities({ filter: { kind: 'Environment' } }),
          catalogApi.getEntities({ filter: { kind: 'Component' } }),
        ],
      );

      // Build unique environment list
      const envSet = new Map<string, string>();
      for (const env of envEntities) {
        const envName =
          env.metadata.annotations?.[CHOREO_ANNOTATIONS.ENVIRONMENT] ||
          env.metadata.name;
        const displayName = env.metadata.title || envName;
        if (!envSet.has(envName)) {
          envSet.set(envName, displayName);
        }
      }
      const envNames = Array.from(envSet.keys());
      setEnvironmentNames(envNames);

      // Fetch release bindings for each component
      const componentRows: ComponentRow[] = [];

      await Promise.all(
        components.map(async component => {
          const annotations = component.metadata.annotations || {};
          const componentName = annotations[CHOREO_ANNOTATIONS.COMPONENT];
          const projectName = annotations[CHOREO_ANNOTATIONS.PROJECT];

          if (!componentName) return;

          try {
            const releaseBindingsData = await client.fetchReleaseBindings(
              component as Entity,
            );

            const environments: Record<string, EnvironmentStatus> = {};
            const bindings = releaseBindingsData?.data?.items;

            if (bindings && Array.isArray(bindings)) {
              for (const binding of bindings) {
                if (binding.environment) {
                  environments[binding.environment.toLowerCase()] = {
                    isDeployed: true,
                    status: binding.status || 'Unknown',
                  };
                }
              }
            }

            componentRows.push({
              name: componentName,
              projectName: projectName || '',
              environments,
            });
          } catch {
            // Skip on error
          }
        }),
      );

      // Sort by component name
      componentRows.sort((a, b) => a.name.localeCompare(b.name));
      setRows(componentRows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch deployment data',
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
      <DashboardIcon className={classes.headerIcon} />
      <Typography variant="h6">Deployment Status</Typography>
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

  if (rows.length === 0) {
    return (
      <InfoCard title={title}>
        <Box className={classes.emptyState}>
          <Typography>No components found</Typography>
        </Box>
      </InfoCard>
    );
  }

  return (
    <InfoCard title={title}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Component</TableCell>
            {environmentNames.map(env => (
              <TableCell key={env} className={classes.statusCell}>
                <Typography className={classes.envHeader}>{env}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {(expanded ? rows : rows.slice(0, DEFAULT_ROWS)).map(row => (
            <TableRow key={row.name} className={classes.tableRow}>
              <TableCell>
                <Tooltip title={`${row.projectName} / ${row.name}`} arrow>
                  <Typography variant="body2" className={classes.componentName}>
                    <Link to={`/catalog/default/component/${row.name}`}>
                      {row.name}
                    </Link>
                  </Typography>
                </Tooltip>
              </TableCell>
              {environmentNames.map(env => (
                <TableCell key={env} className={classes.statusCell}>
                  {getStatusIcon(row.environments[env.toLowerCase()], classes)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > DEFAULT_ROWS && (
        <Box className={classes.showMoreButton}>
          <Button
            size="small"
            color="primary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : `Show All (${rows.length})`}
          </Button>
        </Box>
      )}
    </InfoCard>
  );
};
