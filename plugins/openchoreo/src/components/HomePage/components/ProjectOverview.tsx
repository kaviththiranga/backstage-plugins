import React from 'react';
import {
  makeStyles,
  Theme,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
} from '@material-ui/core';
import { Entity } from '@backstage/catalog-model';
import AccountTree from '@material-ui/icons/AccountTree';
import { HierarchicalItem } from '@openchoreo/backstage-design-system';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  headerCard: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(3),
  },
  avatar: {
    width: theme.spacing(8),
    height: theme.spacing(8),
    backgroundColor: theme.palette.secondary.main,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  metadata: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  componentCard: {
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  },
  componentName: {
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  componentDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
  },
  statCard: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette.secondary.main,
  },
  statLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
}));

interface ProjectOverviewProps {
  project: Entity;
  components: HierarchicalItem[];
  selectedMenuItem: string;
  onComponentClick?: (componentId: string) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  components,
  selectedMenuItem,
  onComponentClick,
}) => {
  const classes = useStyles();

  if (selectedMenuItem === 'components') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" className={classes.sectionTitle}>
          Components in {project.metadata.name}
        </Typography>
        <Grid container spacing={3}>
          {components.map((component) => (
            <Grid key={component.id} item xs={12} sm={6} md={4}>
              <Card
                className={classes.componentCard}
                onClick={() => onComponentClick?.(component.id)}
              >
                <CardContent>
                  <Typography variant="h6" className={classes.componentName}>
                    {component.name}
                  </Typography>
                  {component.description && (
                    <Typography className={classes.componentDescription}>
                      {component.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {components.length === 0 && (
            <Grid item xs={12}>
              <Typography color="textSecondary">
                No components found in this project.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  if (selectedMenuItem === 'builds') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" className={classes.sectionTitle}>
          Builds for {project.metadata.name}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Build information will be displayed here. This section can integrate with your CI/CD systems.
        </Typography>
      </Box>
    );
  }

  if (selectedMenuItem === 'deploy') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" className={classes.sectionTitle}>
          Deployments for {project.metadata.name}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Deployment information will be displayed here. This section can show environment status and deployment history.
        </Typography>
      </Box>
    );
  }

  if (selectedMenuItem !== 'overview') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5">
          {selectedMenuItem.charAt(0).toUpperCase() + selectedMenuItem.slice(1)}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This section is under development.
        </Typography>
      </Box>
    );
  }

  // Get metadata for display
  const owner = project.spec?.owner as string;
  const type = project.spec?.type as string;
  const lifecycle = project.spec?.lifecycle as string;
  const tags = project.metadata.tags || [];

  return (
    <Box className={classes.root}>
      {/* Project Header */}
      <Card className={classes.headerCard}>
        <Avatar className={classes.avatar}>
          <AccountTree fontSize="large" />
        </Avatar>
        <Typography variant="h4" className={classes.title}>
          {project.metadata.name}
        </Typography>
        {project.metadata.description && (
          <Typography variant="body1" className={classes.description}>
            {project.metadata.description}
          </Typography>
        )}
        <Box className={classes.metadata}>
          {owner && <Chip label={`Owner: ${owner}`} size="small" />}
          {type && <Chip label={`Type: ${type}`} size="small" />}
          {lifecycle && <Chip label={`Lifecycle: ${lifecycle}`} size="small" />}
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} style={{ marginBottom: 24 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <Typography className={classes.statNumber}>
              {components.length}
            </Typography>
            <Typography className={classes.statLabel} variant="h6">
              Components
            </Typography>
          </Card>
        </Grid>
        {/* Add more stats as needed */}
      </Grid>

      {/* Components Section */}
      <Typography variant="h5" className={classes.sectionTitle}>
        Components
      </Typography>
      <Grid container spacing={3}>
        {components.slice(0, 6).map((component) => (
          <Grid key={component.id} item xs={12} sm={6} md={4}>
            <Card
              className={classes.componentCard}
              onClick={() => onComponentClick?.(component.id)}
            >
              <CardContent>
                <Typography variant="h6" className={classes.componentName}>
                  {component.name}
                </Typography>
                {component.description && (
                  <Typography className={classes.componentDescription}>
                    {component.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {components.length === 0 && (
          <Grid item xs={12}>
            <Typography color="textSecondary">
              No components found in this project.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};