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
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { Entity } from '@backstage/catalog-model';
import Apps from '@material-ui/icons/Apps';

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
    backgroundColor: theme.palette.info.main,
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
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
  },
  infoCard: {
    height: '100%',
  },
  listItem: {
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

interface ComponentOverviewProps {
  component: Entity;
  selectedMenuItem: string;
}

export const ComponentOverview: React.FC<ComponentOverviewProps> = ({
  component,
  selectedMenuItem,
}) => {
  const classes = useStyles();

  if (selectedMenuItem === 'builds') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" className={classes.sectionTitle}>
          Builds for {component.metadata.name}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Build information for this component will be displayed here.
        </Typography>
      </Box>
    );
  }

  if (selectedMenuItem === 'deploy') {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" className={classes.sectionTitle}>
          Deployments for {component.metadata.name}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Deployment information for this component will be displayed here.
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
  const owner = component.spec?.owner as string;
  const type = component.spec?.type as string;
  const lifecycle = component.spec?.lifecycle as string;
  const system = component.spec?.system as string;
  const tags = component.metadata.tags || [];
  const links = component.metadata.links || [];

  return (
    <Box className={classes.root}>
      {/* Component Header */}
      <Card className={classes.headerCard}>
        <Avatar className={classes.avatar}>
          <Apps fontSize="large" />
        </Avatar>
        <Typography variant="h4" className={classes.title}>
          {component.metadata.name}
        </Typography>
        {component.metadata.description && (
          <Typography variant="body1" className={classes.description}>
            {component.metadata.description}
          </Typography>
        )}
        <Box className={classes.metadata}>
          {owner && <Chip label={`Owner: ${owner}`} size="small" />}
          {type && <Chip label={`Type: ${type}`} size="small" />}
          {lifecycle && <Chip label={`Lifecycle: ${lifecycle}`} size="small" />}
          {system && <Chip label={`System: ${system}`} size="small" />}
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Card>

      {/* Component Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className={classes.infoCard}>
            <CardContent>
              <Typography variant="h6" className={classes.sectionTitle}>
                Component Information
              </Typography>
              <List dense>
                <ListItem className={classes.listItem}>
                  <ListItemText
                    primary="Name"
                    secondary={component.metadata.name}
                  />
                </ListItem>
                {component.metadata.namespace && (
                  <ListItem className={classes.listItem}>
                    <ListItemText
                      primary="Namespace"
                      secondary={component.metadata.namespace}
                    />
                  </ListItem>
                )}
                {owner && (
                  <ListItem className={classes.listItem}>
                    <ListItemText
                      primary="Owner"
                      secondary={owner}
                    />
                  </ListItem>
                )}
                {type && (
                  <ListItem className={classes.listItem}>
                    <ListItemText
                      primary="Type"
                      secondary={type}
                    />
                  </ListItem>
                )}
                {lifecycle && (
                  <ListItem className={classes.listItem}>
                    <ListItemText
                      primary="Lifecycle"
                      secondary={lifecycle}
                    />
                  </ListItem>
                )}
                {system && (
                  <ListItem className={classes.listItem}>
                    <ListItemText
                      primary="System"
                      secondary={system}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {links.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card className={classes.infoCard}>
              <CardContent>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Links
                </Typography>
                <List dense>
                  {links.map((link, index) => (
                    <ListItem key={index} className={classes.listItem}>
                      <ListItemText
                        primary={link.title || link.url}
                        secondary={
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {link.url}
                          </a>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};