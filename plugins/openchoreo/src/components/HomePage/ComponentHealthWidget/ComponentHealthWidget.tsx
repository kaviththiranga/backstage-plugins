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
  TableRow,
  Chip,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Skeleton } from '@material-ui/lab';
import FavoriteIcon from '@material-ui/icons/Favorite';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
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
  componentName: {
    fontWeight: 500,
  },
  healthIcon: {
    fontSize: '1.1rem',
    verticalAlign: 'middle',
    marginRight: theme.spacing(0.5),
  },
  healthy: {
    color: theme.palette.success?.main || '#4caf50',
  },
  degraded: {
    color: theme.palette.warning?.main || '#ff9800',
  },
  unhealthy: {
    color: theme.palette.error.main,
  },
  unknown: {
    color: theme.palette.text.disabled,
  },
  chip: {
    height: 20,
    fontSize: '0.7rem',
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
  detailChips: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap' as const,
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

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

interface ComponentHealth {
  name: string;
  projectName: string;
  health: HealthStatus;
  buildStatus: string | null;
  deployedEnvCount: number;
  endpointCount: number;
}

function computeHealth(
  buildStatus: string | null,
  deploymentStatuses: string[],
): HealthStatus {
  const hasBuildFailure = buildStatus
    ? buildStatus.toLowerCase().includes('fail') ||
      buildStatus.toLowerCase().includes('error')
    : false;

  const hasDeploymentFailure = deploymentStatuses.some(s => {
    const sl = s.toLowerCase();
    return sl.includes('fail') || sl.includes('error');
  });

  const hasDeploymentWarning = deploymentStatuses.some(s => {
    const sl = s.toLowerCase();
    return sl.includes('notready') || sl.includes('degraded');
  });

  if (hasDeploymentFailure || hasBuildFailure) return 'unhealthy';
  if (hasDeploymentWarning) return 'degraded';
  if (deploymentStatuses.length === 0 && !buildStatus) return 'unknown';
  return 'healthy';
}

function getHealthIcon(
  health: HealthStatus,
  classes: ReturnType<typeof useStyles>,
) {
  switch (health) {
    case 'healthy':
      return (
        <CheckCircleIcon
          className={`${classes.healthIcon} ${classes.healthy}`}
        />
      );
    case 'degraded':
      return (
        <WarningIcon className={`${classes.healthIcon} ${classes.degraded}`} />
      );
    case 'unhealthy':
      return (
        <ErrorIcon className={`${classes.healthIcon} ${classes.unhealthy}`} />
      );
    default:
      return (
        <HelpOutlineIcon
          className={`${classes.healthIcon} ${classes.unknown}`}
        />
      );
  }
}

function getBuildChipColor(
  status: string,
): 'default' | 'primary' | 'secondary' {
  const s = status.toLowerCase();
  if (s.includes('success') || s.includes('complete')) return 'primary';
  if (s.includes('fail') || s.includes('error')) return 'secondary';
  return 'default';
}

function getBuildLabel(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('success') || s.includes('complete')) return 'Build OK';
  if (s.includes('fail')) return 'Build Failed';
  if (s.includes('error')) return 'Build Error';
  if (s.includes('running') || s.includes('progress')) return 'Building';
  if (s.includes('pending')) return 'Build Pending';
  return status;
}

export const ComponentHealthWidget = () => {
  const classes = useStyles();
  const [components, setComponents] = useState<ComponentHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const catalogApi = useApi(catalogApiRef);
  const client = useApi(openChoreoClientApiRef);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { items: componentEntities } = await catalogApi.getEntities({
        filter: { kind: 'Component' },
      });

      const healthData: ComponentHealth[] = [];

      await Promise.all(
        componentEntities.map(async entity => {
          const annotations = entity.metadata.annotations || {};
          const componentName = annotations[CHOREO_ANNOTATIONS.COMPONENT];
          const projectName = annotations[CHOREO_ANNOTATIONS.PROJECT];
          const namespaceName = annotations[CHOREO_ANNOTATIONS.NAMESPACE];

          if (!componentName || !projectName || !namespaceName) return;

          try {
            const [releaseBindingsData, buildsData] = await Promise.all([
              client.fetchReleaseBindings(entity as Entity),
              client.fetchBuilds(componentName, projectName, namespaceName),
            ]);

            // Latest build status
            let buildStatus: string | null = null;
            if (
              Array.isArray(buildsData) &&
              buildsData.length > 0 &&
              buildsData[0].status
            ) {
              buildStatus = buildsData[0].status;
            }

            // Deployment statuses
            const deploymentStatuses: string[] = [];
            let deployedEnvCount = 0;
            let endpointCount = 0;
            const bindings = releaseBindingsData?.data?.items;

            if (bindings && Array.isArray(bindings)) {
              for (const binding of bindings) {
                deployedEnvCount++;
                if (binding.status) {
                  deploymentStatuses.push(binding.status);
                }
                if (binding.endpoints) {
                  endpointCount += binding.endpoints.length;
                }
              }
            }

            healthData.push({
              name: componentName,
              projectName,
              health: computeHealth(buildStatus, deploymentStatuses),
              buildStatus,
              deployedEnvCount,
              endpointCount,
            });
          } catch {
            // Skip component on error
          }
        }),
      );

      // Sort: unhealthy first, then degraded, then unknown, then healthy
      const healthOrder: Record<HealthStatus, number> = {
        unhealthy: 0,
        degraded: 1,
        unknown: 2,
        healthy: 3,
      };
      healthData.sort((a, b) => healthOrder[a.health] - healthOrder[b.health]);

      setComponents(healthData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch health data',
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
      <FavoriteIcon className={classes.headerIcon} />
      <Typography variant="h6">Component Health</Typography>
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
          <Typography>No components found</Typography>
        </Box>
      </InfoCard>
    );
  }

  // Summary counts
  const healthyCt = components.filter(c => c.health === 'healthy').length;
  const degradedCt = components.filter(c => c.health === 'degraded').length;
  const unhealthyCt = components.filter(c => c.health === 'unhealthy').length;

  return (
    <InfoCard title={title}>
      {/* Summary bar */}
      <Box className={classes.summaryBar}>
        <Box className={classes.summaryItem}>
          <CheckCircleIcon
            className={`${classes.healthIcon} ${classes.healthy}`}
          />
          <Typography className={classes.summaryCount}>{healthyCt}</Typography>
          <Typography className={classes.summaryLabel}>Healthy</Typography>
        </Box>
        <Box className={classes.summaryItem}>
          <WarningIcon
            className={`${classes.healthIcon} ${classes.degraded}`}
          />
          <Typography className={classes.summaryCount}>{degradedCt}</Typography>
          <Typography className={classes.summaryLabel}>Degraded</Typography>
        </Box>
        <Box className={classes.summaryItem}>
          <ErrorIcon className={`${classes.healthIcon} ${classes.unhealthy}`} />
          <Typography className={classes.summaryCount}>
            {unhealthyCt}
          </Typography>
          <Typography className={classes.summaryLabel}>Unhealthy</Typography>
        </Box>
      </Box>

      {/* Component table */}
      <Table size="small">
        <TableBody>
          {(expanded ? components : components.slice(0, DEFAULT_ROWS)).map(
            comp => (
              <TableRow key={comp.name} className={classes.tableRow}>
                <TableCell padding="none" style={{ width: 28 }}>
                  {getHealthIcon(comp.health, classes)}
                </TableCell>
                <TableCell>
                  <Link to={`/catalog/default/component/${comp.name}`}>
                    <Typography
                      variant="body2"
                      className={classes.componentName}
                    >
                      {comp.name}
                    </Typography>
                  </Link>
                </TableCell>
                <TableCell align="right">
                  <Box className={classes.detailChips}>
                    {comp.buildStatus && (
                      <Chip
                        label={getBuildLabel(comp.buildStatus)}
                        color={getBuildChipColor(comp.buildStatus)}
                        size="small"
                        className={classes.chip}
                      />
                    )}
                    {comp.deployedEnvCount > 0 && (
                      <Tooltip title="Deployed environments" arrow>
                        <Chip
                          label={`${comp.deployedEnvCount} env`}
                          size="small"
                          className={classes.chip}
                        />
                      </Tooltip>
                    )}
                    {comp.endpointCount > 0 && (
                      <Tooltip title="Exposed endpoints" arrow>
                        <Chip
                          label={`${comp.endpointCount} ep`}
                          size="small"
                          className={classes.chip}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
      {components.length > DEFAULT_ROWS && (
        <Box className={classes.showMoreButton}>
          <Button
            size="small"
            color="primary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : `Show All (${components.length})`}
          </Button>
        </Box>
      )}
    </InfoCard>
  );
};
