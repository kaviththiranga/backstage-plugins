import React from 'react';
import {
  makeStyles,
  Theme,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@material-ui/core';
import { HierarchicalItem } from '@openchoreo/backstage-design-system';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flex: 1,
  },
  statCard: {
    textAlign: 'center',
    padding: theme.spacing(3),
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  statLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
  },
  itemCard: {
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-1px)',
    },
  },
  itemName: {
    fontWeight: 500,
  },
  itemDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginTop: theme.spacing(0.5),
  },
}));

interface HomePageOverviewProps {
  organizations: HierarchicalItem[];
  projects: HierarchicalItem[];
  components: HierarchicalItem[];
  selectedMenuItem: string;
}

export const HomePageOverview: React.FC<HomePageOverviewProps> = ({
  organizations,
  projects,
  components,
  selectedMenuItem,
}) => {
  const classes = useStyles();

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

  return (
    <Box className={classes.root}>
      <Typography variant="h4" className={classes.sectionTitle}>
        Platform Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} style={{ marginBottom: 32 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statNumber}>
                {organizations.length}
              </Typography>
              <Typography className={classes.statLabel} variant="h6">
                Organizations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statNumber}>
                {projects.length}
              </Typography>
              <Typography className={classes.statLabel} variant="h6">
                Projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statNumber}>
                {components.length}
              </Typography>
              <Typography className={classes.statLabel} variant="h6">
                Components
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent/Featured Items */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Organizations
              </Typography>
              {organizations.length === 0 ? (
                <Typography color="textSecondary">
                  No organizations found. Create your first organization to get started.
                </Typography>
              ) : (
                organizations.slice(0, 5).map((org) => (
                  <Card key={org.id} className={classes.itemCard} variant="outlined">
                    <CardContent>
                      <Typography variant="body1" className={classes.itemName}>
                        {org.name}
                      </Typography>
                      {org.description && (
                        <Typography className={classes.itemDescription}>
                          {org.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Recent Projects
              </Typography>
              {projects.length === 0 ? (
                <Typography color="textSecondary">
                  No projects found. Create your first project to get started.
                </Typography>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <Card key={project.id} className={classes.itemCard} variant="outlined">
                    <CardContent>
                      <Typography variant="body1" className={classes.itemName}>
                        {project.name}
                      </Typography>
                      {project.description && (
                        <Typography className={classes.itemDescription}>
                          {project.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Recent Components
              </Typography>
              <Grid container spacing={2}>
                {components.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography color="textSecondary">
                      No components found. Create your first component to get started.
                    </Typography>
                  </Grid>
                ) : (
                  components.slice(0, 8).map((component) => (
                    <Grid key={component.id} item xs={12} sm={6} md={4} lg={3}>
                      <Card className={classes.itemCard} variant="outlined">
                        <CardContent>
                          <Typography variant="body1" className={classes.itemName}>
                            {component.name}
                          </Typography>
                          {component.description && (
                            <Typography className={classes.itemDescription}>
                              {component.description}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};