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
import Business from '@material-ui/icons/Business';
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
    backgroundColor: theme.palette.primary.main,
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
  projectCard: {
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  },
  projectName: {
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  projectDescription: {
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
    color: theme.palette.primary.main,
  },
  statLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
}));

interface OrganizationOverviewProps {
  organization: Entity;
  projects: HierarchicalItem[];
  selectedMenuItem: string;
  onProjectClick?: (projectId: string) => void;
}

export const OrganizationOverview: React.FC<OrganizationOverviewProps> = ({
  organization,
  projects,
  selectedMenuItem,
  onProjectClick,
}) => {
  const classes = useStyles();

  if (selectedMenuItem === 'projects') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" className={classes.sectionTitle}>
          Projects in {organization.metadata.name}
        </Typography>
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid key={project.id} item xs={12} sm={6} md={4}>
              <Card
                className={classes.projectCard}
                onClick={() => onProjectClick?.(project.id)}
              >
                <CardContent>
                  <Typography variant="h6" className={classes.projectName}>
                    {project.name}
                  </Typography>
                  {project.description && (
                    <Typography className={classes.projectDescription}>
                      {project.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {projects.length === 0 && (
            <Grid item xs={12}>
              <Typography color="textSecondary">
                No projects found in this organization.
              </Typography>
            </Grid>
          )}
        </Grid>
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
  const owner = organization.spec?.owner as string;
  const type = organization.spec?.type as string;
  const tags = organization.metadata.tags || [];

  return (
    <Box className={classes.root}>
      {/* Organization Header */}
      <Card className={classes.headerCard}>
        <Avatar className={classes.avatar}>
          <Business fontSize="large" />
        </Avatar>
        <Typography variant="h4" className={classes.title}>
          {organization.metadata.name}
        </Typography>
        {organization.metadata.description && (
          <Typography variant="body1" className={classes.description}>
            {organization.metadata.description}
          </Typography>
        )}
        <Box className={classes.metadata}>
          {owner && <Chip label={`Owner: ${owner}`} size="small" />}
          {type && <Chip label={`Type: ${type}`} size="small" />}
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
              {projects.length}
            </Typography>
            <Typography className={classes.statLabel} variant="h6">
              Projects
            </Typography>
          </Card>
        </Grid>
        {/* Add more stats as needed */}
      </Grid>

      {/* Projects Section */}
      <Typography variant="h5" className={classes.sectionTitle}>
        Projects
      </Typography>
      <Grid container spacing={3}>
        {projects.slice(0, 6).map((project) => (
          <Grid key={project.id} item xs={12} sm={6} md={4}>
            <Card
              className={classes.projectCard}
              onClick={() => onProjectClick?.(project.id)}
            >
              <CardContent>
                <Typography variant="h6" className={classes.projectName}>
                  {project.name}
                </Typography>
                {project.description && (
                  <Typography className={classes.projectDescription}>
                    {project.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {projects.length === 0 && (
          <Grid item xs={12}>
            <Typography color="textSecondary">
              No projects found in this organization.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};