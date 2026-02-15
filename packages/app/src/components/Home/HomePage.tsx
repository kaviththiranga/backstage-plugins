import { Content, Page, Header } from '@backstage/core-components';
import {
  HomePageRecentlyVisited,
  HomePageStarredEntities,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import { Grid, Typography, Box } from '@material-ui/core';
import { useStyles } from './styles';
import { useUserGroups } from '../../hooks';
import { useNamespacePermission } from '@openchoreo/backstage-plugin-react';
import {
  MyProjectsWidget,
  QuickActionsSection,
  LatestBuildsWidget,
  DeploymentStatusWidget,
  ComponentHealthWidget,
  HttpMetricsWidget,
  ActiveAlertsWidget,
} from '@openchoreo/backstage-plugin';
import {
  HomePagePlatformDetailsCard,
  InfrastructureWidget,
  AgentHealthWidget,
  DeveloperPortalWidget,
} from '@openchoreo/backstage-plugin-platform-engineer-core';

/**
 * Custom HomePage that shows content based on user permissions
 */
export const HomePage = () => {
  const classes = useStyles();
  const { userName, loading } = useUserGroups();
  const { canView: canViewPlatformDetails } = useNamespacePermission();

  if (loading) {
    return (
      <Page themeId="home">
        <Header title="Loading..." />
        <Content>
          <Typography>Loading user information...</Typography>
        </Content>
      </Page>
    );
  }

  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Header title={`Welcome, ${userName}!`} />
        <Content>
          <Grid container spacing={3}>
            {/* Search Bar */}
            <Grid item xs={12}>
              <HomePageSearchBar
                InputProps={{
                  classes: {
                    root: classes.searchBarInput,
                    notchedOutline: classes.searchBarOutline,
                  },
                }}
                placeholder="Search"
              />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <QuickActionsSection />
            </Grid>

            {/* My Projects & Components Summary */}
            <Grid item xs={12} md={4} sm={6}>
              <MyProjectsWidget />
            </Grid>

            {/* Starred Entities and Recently Visited */}
            <Grid item xs={12} md={4} sm={6} style={{ display: 'flex' }}>
              <Box className={classes.starredEntitiesWrapper}>
                <HomePageStarredEntities />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sm={6} style={{ display: 'flex' }}>
              <Box className={classes.starredEntitiesWrapper}>
                <HomePageRecentlyVisited />
              </Box>
            </Grid>

            {/* Component Health & Latest Builds */}
            <Grid item xs={12} md={6}>
              <ComponentHealthWidget />
            </Grid>
            <Grid item xs={12} md={6}>
              <LatestBuildsWidget />
            </Grid>

            {/* Deployment Status Matrix */}
            <Grid item xs={12}>
              <DeploymentStatusWidget />
            </Grid>

            {/* Observability: HTTP Metrics & Alerts */}
            <Grid item xs={12} md={6}>
              <HttpMetricsWidget />
            </Grid>
            <Grid item xs={12} md={6}>
              <ActiveAlertsWidget />
            </Grid>

            {/* Platform Engineer Section - visible only with namespace read permission */}
            {canViewPlatformDetails && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h5">Platform Overview</Typography>
                </Grid>
                <Grid item xs={12} md={4} sm={6}>
                  <InfrastructureWidget />
                </Grid>
                <Grid item xs={12} md={4} sm={6}>
                  <AgentHealthWidget />
                </Grid>
                <Grid item xs={12} md={4} sm={6}>
                  <DeveloperPortalWidget />
                </Grid>
                <Grid item xs={12}>
                  <HomePagePlatformDetailsCard />
                </Grid>
              </>
            )}
          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
