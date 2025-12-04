import type { FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import SettingsInputComponentIcon from '@material-ui/icons/SettingsInputComponent';
import LinkIcon from '@material-ui/icons/Link';

const useStyles = makeStyles(theme => ({
  sectionList: {
    padding: 0,
  },
  listItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  sectionIcon: {
    minWidth: 40,
    color: theme.palette.text.secondary,
  },
  statusIcon: {
    minWidth: 32,
  },
  configuredIcon: {
    color: theme.palette.success.main,
  },
  emptyIcon: {
    color: theme.palette.text.disabled,
  },
  countChip: {
    marginRight: theme.spacing(1),
  },
  helperText: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  editButton: {
    marginLeft: theme.spacing(1),
  },
}));

type TabId = 'containers' | 'endpoints' | 'connections';

interface SectionConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count: number;
  singularLabel: string;
  pluralLabel: string;
}

interface WorkloadReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  onNavigateToTab: (tabId: TabId) => void;
  containerCount: number;
  endpointCount: number;
  connectionCount: number;
  isProcessing: boolean;
}

export const WorkloadReviewDialog: FC<WorkloadReviewDialogProps> = ({
  open,
  onClose,
  onProceed,
  onNavigateToTab,
  containerCount,
  endpointCount,
  connectionCount,
  isProcessing,
}) => {
  const classes = useStyles();

  const sections: SectionConfig[] = [
    {
      id: 'containers',
      label: 'Containers',
      icon: <ViewModuleIcon />,
      count: containerCount,
      singularLabel: 'container',
      pluralLabel: 'containers',
    },
    {
      id: 'endpoints',
      label: 'Endpoints',
      icon: <SettingsInputComponentIcon />,
      count: endpointCount,
      singularLabel: 'endpoint',
      pluralLabel: 'endpoints',
    },
    {
      id: 'connections',
      label: 'Connections',
      icon: <LinkIcon />,
      count: connectionCount,
      singularLabel: 'connection',
      pluralLabel: 'connections',
    },
  ];

  const getCountText = (count: number, singular: string, plural: string) => {
    if (count === 0) return `No ${plural}`;
    if (count === 1) return `1 ${singular}`;
    return `${count} ${plural}`;
  };

  const handleEditClick = (tabId: TabId) => {
    onNavigateToTab(tabId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Review Workload Configuration</DialogTitle>

      <DialogContent dividers>
        <List className={classes.sectionList}>
          {sections.map(section => {
            const isConfigured = section.count > 0;
            return (
              <ListItem key={section.id} className={classes.listItem}>
                <ListItemIcon className={classes.statusIcon}>
                  {isConfigured ? (
                    <CheckCircleIcon className={classes.configuredIcon} />
                  ) : (
                    <RadioButtonUncheckedIcon className={classes.emptyIcon} />
                  )}
                </ListItemIcon>
                <ListItemIcon className={classes.sectionIcon}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  secondary={getCountText(
                    section.count,
                    section.singularLabel,
                    section.pluralLabel,
                  )}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={section.count}
                    size="small"
                    className={classes.countChip}
                    color={isConfigured ? 'primary' : 'default'}
                    variant={isConfigured ? 'default' : 'outlined'}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleEditClick(section.id)}
                    disabled={isProcessing}
                    className={classes.editButton}
                  >
                    {isConfigured ? 'Edit' : 'Add'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        <Box className={classes.helperText}>
          <Typography variant="body2" color="textSecondary">
            <strong>Endpoints</strong> and <strong>Connections</strong> are
            optional but recommended for exposing your service and connecting to
            dependencies.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Go Back
        </Button>
        <Button
          onClick={onProceed}
          color="primary"
          variant="contained"
          disabled={isProcessing}
          startIcon={
            isProcessing ? (
              <CircularProgress size={20} color="inherit" />
            ) : undefined
          }
        >
          {isProcessing ? 'Saving...' : 'Save & Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
