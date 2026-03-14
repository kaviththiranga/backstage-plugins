import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { Link } from '@backstage/core-components';
import RefreshIcon from '@material-ui/icons/Refresh';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import CheckCircleIcon from '@material-ui/icons/CheckCircleOutlined';
import ErrorIcon from '@material-ui/icons/ErrorOutlined';
import WarningIcon from '@material-ui/icons/ReportProblemOutlined';
import { Card } from '@openchoreo/backstage-design-system';
import {
  useEnvironmentReadPermission,
  ForbiddenState,
} from '@openchoreo/backstage-plugin-react';
import { useDeploymentStatus } from './useDeploymentStatus';
import { useOverviewCardStyles } from './styles';
import type { Environment } from '../hooks/useEnvironmentData';

type StatusIconClass =
  | 'statusIconReady'
  | 'statusIconWarning'
  | 'statusIconError';

interface RefreshButtonProps {
  tooltip: string;
  onClick: () => void;
  disabled: boolean;
  refreshing: boolean;
}

const RefreshButton = ({
  tooltip,
  onClick,
  disabled,
  refreshing,
}: RefreshButtonProps) => (
  <Tooltip title={tooltip}>
    <IconButton
      size="small"
      onClick={onClick}
      disabled={disabled}
      aria-label={tooltip.toLowerCase()}
    >
      {refreshing ? (
        <CircularProgress size={18} />
      ) : (
        <RefreshIcon fontSize="small" />
      )}
    </IconButton>
  </Tooltip>
);

function getStatusIcon(env: Environment): {
  Icon: typeof CheckCircleIcon | typeof WarningIcon | typeof ErrorIcon | null;
  iconClass: StatusIconClass | null;
  tooltipSuffix: string;
} {
  const status = env.deployment?.status;
  if (!status)
    return { Icon: null, iconClass: null, tooltipSuffix: 'Not deployed' };

  switch (status) {
    case 'Ready':
      return {
        Icon: CheckCircleIcon,
        iconClass: 'statusIconReady',
        tooltipSuffix: 'Deployed (Ready)',
      };
    case 'NotReady':
      return {
        Icon: WarningIcon,
        iconClass: 'statusIconWarning',
        tooltipSuffix: 'Deployed (NotReady)',
      };
    case 'Failed':
      return {
        Icon: ErrorIcon,
        iconClass: 'statusIconError',
        tooltipSuffix: 'Deployed (Failed)',
      };
    default:
      return { Icon: null, iconClass: null, tooltipSuffix: 'Not deployed' };
  }
}

export const DeploymentStatusCard = () => {
  const classes = useOverviewCardStyles();
  const { environments, loading, error, isForbidden, refreshing, refresh } =
    useDeploymentStatus();
  const { canViewEnvironments, loading: permissionLoading } =
    useEnvironmentReadPermission();

  // Loading state
  if (loading || permissionLoading) {
    return (
      <Card padding={16} className={classes.card}>
        <Box className={classes.cardHeader}>
          <Skeleton variant="text" width={100} height={28} />
        </Box>
        <Box className={classes.content}>
          <Skeleton variant="rect" height={60} />
        </Box>
      </Card>
    );
  }

  // Permission denied state
  if (isForbidden || !canViewEnvironments) {
    return (
      <Card padding={16} className={classes.card}>
        <Box className={classes.cardHeader}>
          <Typography className={classes.cardTitle}>Deployments</Typography>
        </Box>
        <ForbiddenState
          variant="compact"
          message="You do not have permission to view deployment information."
        />
        <Box className={classes.actions}>
          <RefreshButton
            tooltip="Retry"
            onClick={refresh}
            disabled={refreshing}
            refreshing={refreshing}
          />
        </Box>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card padding={16} className={classes.card}>
        <Box className={classes.cardHeader}>
          <Typography className={classes.cardTitle}>Deployments</Typography>
        </Box>
        <Box className={classes.disabledState}>
          <Typography variant="body2" color="error">
            Failed to load deployment data
          </Typography>
        </Box>
      </Card>
    );
  }

  // No environments
  if (environments.length === 0) {
    return (
      <Card padding={16} className={classes.card}>
        <Box className={classes.cardHeader}>
          <Typography className={classes.cardTitle}>Deployments</Typography>
        </Box>
        <Box className={classes.disabledState}>
          <CloudOffIcon className={classes.disabledIcon} />
          <Typography variant="body2">No environments configured</Typography>
          <Typography variant="caption" color="textSecondary">
            Set up environments from the Deploy tab
          </Typography>
        </Box>
        <Box className={classes.actions}>
          <Link to="environments" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" color="primary" size="small">
              Go to Deploy
            </Button>
          </Link>
        </Box>
      </Card>
    );
  }

  // Environments exist — show chips
  return (
    <Card padding={16} className={classes.card}>
      <Box className={classes.cardHeader}>
        <Typography className={classes.cardTitle}>Deployments</Typography>
      </Box>

      <Box className={classes.content}>
        <Box className={classes.environmentChips}>
          {environments.map(env => {
            const { Icon, iconClass, tooltipSuffix } = getStatusIcon(env);

            return (
              <Tooltip key={env.name} title={`${env.name}: ${tooltipSuffix}`}>
                <Chip
                  size="small"
                  className={classes.envChip}
                  label={
                    <Box display="flex" alignItems="center" gridGap={4}>
                      <Typography variant="body2">{env.name}</Typography>
                      {Icon && iconClass && (
                        <Icon
                          className={classes[iconClass]}
                          style={{ fontSize: '18px' }}
                        />
                      )}
                    </Box>
                  }
                  color="default"
                  variant="outlined"
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Box className={classes.actions}>
        <Link to="environments" style={{ textDecoration: 'none' }}>
          <Button variant="outlined" color="primary" size="small">
            Go to Deploy
          </Button>
        </Link>
        <RefreshButton
          tooltip="Refresh status"
          onClick={refresh}
          disabled={refreshing}
          refreshing={refreshing}
        />
      </Box>
    </Card>
  );
};
