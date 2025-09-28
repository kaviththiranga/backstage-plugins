import { Fragment } from 'react';
import {
  makeStyles,
  Theme,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Paper,
} from '@material-ui/core';
import Dashboard from '@material-ui/icons/Dashboard';
import Business from '@material-ui/icons/Business';
import AccountTree from '@material-ui/icons/AccountTree';
import Apps from '@material-ui/icons/Apps';
import Settings from '@material-ui/icons/Settings';
import Description from '@material-ui/icons/Description';
import Assessment from '@material-ui/icons/Assessment';
import Build from '@material-ui/icons/Build';
import CloudQueue from '@material-ui/icons/CloudQueue';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: 240,
    height: '100%',
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    padding: 0,
  },
  title: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  menuList: {
    padding: 0,
  },
  menuItem: {
    padding: theme.spacing(1, 2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  selectedItem: {
    backgroundColor: `${theme.palette.primary.main}20`,
    borderRight: `3px solid ${theme.palette.primary.main}`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.main}30`,
    },
  },
  menuIcon: {
    minWidth: 40,
    color: theme.palette.text.secondary,
  },
  menuText: {
    margin: 0,
  },
  sectionDivider: {
    margin: theme.spacing(1, 0),
  },
}));

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  section?: string;
}

export interface DynamicSidebarProps {
  title: string;
  menuItems: MenuItem[];
  selectedItem?: string;
  onItemClick?: (itemId: string, path?: string) => void;
}

const getIconForType = (type: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    overview: <Dashboard />,
    organization: <Business />,
    project: <AccountTree />,
    component: <Apps />,
    settings: <Settings />,
    docs: <Description />,
    analytics: <Assessment />,
    builds: <Build />,
    deploy: <CloudQueue />,
  };
  return iconMap[type] || <Apps />;
};

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  title,
  menuItems,
  selectedItem,
  onItemClick,
}) => {
  const classes = useStyles();

  // Group menu items by section
  const groupedItems = menuItems.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleItemClick = (item: MenuItem) => {
    onItemClick?.(item.id, item.path);
  };

  return (
    <Paper className={classes.root} square elevation={0}>
      <Box className={classes.title}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>

      <List className={classes.menuList}>
        {Object.entries(groupedItems).map(([sectionName, items], sectionIndex) => (
          <Fragment key={sectionName}>
            {sectionIndex > 0 && <Divider className={classes.sectionDivider} />}

            {items.map((item) => (
              <ListItem
                key={item.id}
                button
                className={`${classes.menuItem} ${
                  selectedItem === item.id ? classes.selectedItem : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <ListItemIcon className={classes.menuIcon}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  className={classes.menuText}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: selectedItem === item.id ? 'primary' : 'textPrimary',
                  }}
                />
              </ListItem>
            ))}
          </Fragment>
        ))}
      </List>
    </Paper>
  );
};

// Predefined menu configurations for different levels
export const getOrganizationMenuItems = (): MenuItem[] => [
  {
    id: 'overview',
    label: 'Overview',
    icon: getIconForType('overview'),
    section: 'main',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: getIconForType('project'),
    section: 'main',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: getIconForType('analytics'),
    section: 'tools',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: getIconForType('settings'),
    section: 'tools',
  },
];

export const getProjectMenuItems = (): MenuItem[] => [
  {
    id: 'overview',
    label: 'Overview',
    icon: getIconForType('overview'),
    section: 'main',
  },
  {
    id: 'components',
    label: 'Components',
    icon: getIconForType('component'),
    section: 'main',
  },
  {
    id: 'builds',
    label: 'Builds',
    icon: getIconForType('builds'),
    section: 'development',
  },
  {
    id: 'deploy',
    label: 'Deploy',
    icon: getIconForType('deploy'),
    section: 'development',
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: getIconForType('docs'),
    section: 'tools',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: getIconForType('analytics'),
    section: 'tools',
  },
];

export const getComponentMenuItems = (): MenuItem[] => [
  {
    id: 'overview',
    label: 'Overview',
    icon: getIconForType('overview'),
    section: 'main',
  },
  {
    id: 'builds',
    label: 'Builds',
    icon: getIconForType('builds'),
    section: 'development',
  },
  {
    id: 'deploy',
    label: 'Deploy',
    icon: getIconForType('deploy'),
    section: 'development',
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: getIconForType('docs'),
    section: 'tools',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: getIconForType('settings'),
    section: 'tools',
  },
];