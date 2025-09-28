import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  Theme,
  Paper,
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
} from '@material-ui/core';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import ChevronRight from '@material-ui/icons/ChevronRight';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(1, 2),
    backgroundColor: '#f8f9fa',
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  dropdown: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 32,
    minWidth: 140, // Prevent layout shifts
    padding: theme.spacing(0.5, 1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  dropdownButton: {
    textTransform: 'none',
    justifyContent: 'flex-start',
    color: theme.palette.text.primary,
    fontWeight: 'normal',
  },
  arrow: {
    color: theme.palette.text.secondary,
    fontSize: 16,
  },
  separator: {
    color: theme.palette.text.secondary,
    fontSize: 16,
    transition: 'opacity 0.2s ease-in-out',
  },
  dropdownSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out, transform 0.2s ease-in-out',
  },
  hidden: {
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    transform: 'scale(0.95)',
  },
  visible: {
    opacity: 1,
    visibility: 'visible',
    pointerEvents: 'auto',
    transform: 'scale(1)',
  },
  menuItem: {
    minHeight: 36,
  },
  selected: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  placeholder: {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
}));

export interface HierarchicalItem {
  id: string;
  name: string;
  description?: string;
}

export interface HierarchicalBreadcrumbProps {
  organizations: HierarchicalItem[];
  projects: HierarchicalItem[];
  components: HierarchicalItem[];
  selectedOrganization?: string;
  selectedProject?: string;
  selectedComponent?: string;
  onOrganizationChange?: (orgId: string | undefined) => void;
  onProjectChange?: (projectId: string | undefined) => void;
  onComponentChange?: (componentId: string | undefined) => void;
  loading?: boolean;
}

export const HierarchicalBreadcrumb: React.FC<HierarchicalBreadcrumbProps> = React.memo(({
  organizations,
  projects,
  components,
  selectedOrganization,
  selectedProject,
  selectedComponent,
  onOrganizationChange,
  onProjectChange,
  onComponentChange,
  loading = false,
}) => {
  const classes = useStyles();
  const [orgAnchor, setOrgAnchor] = useState<null | HTMLElement>(null);
  const [projectAnchor, setProjectAnchor] = useState<null | HTMLElement>(null);
  const [componentAnchor, setComponentAnchor] = useState<null | HTMLElement>(null);

  const selectedOrg = useMemo(
    () => organizations.find(org => org.id === selectedOrganization),
    [organizations, selectedOrganization]
  );
  const selectedProj = useMemo(
    () => projects.find(proj => proj.id === selectedProject),
    [projects, selectedProject]
  );
  const selectedComp = useMemo(
    () => components.find(comp => comp.id === selectedComponent),
    [components, selectedComponent]
  );

  const showProjectSection = Boolean(selectedOrganization);
  const showComponentSection = Boolean(selectedProject);

  const handleOrgClick = (event: React.MouseEvent<HTMLElement>) => {
    setOrgAnchor(event.currentTarget);
  };

  const handleProjectClick = (event: React.MouseEvent<HTMLElement>) => {
    setProjectAnchor(event.currentTarget);
  };

  const handleComponentClick = (event: React.MouseEvent<HTMLElement>) => {
    setComponentAnchor(event.currentTarget);
  };

  const handleOrgSelect = (orgId: string | undefined) => {
    setOrgAnchor(null);
    onOrganizationChange?.(orgId);
  };

  const handleProjectSelect = (projectId: string | undefined) => {
    setProjectAnchor(null);
    onProjectChange?.(projectId);
  };

  const handleComponentSelect = (componentId: string | undefined) => {
    setComponentAnchor(null);
    onComponentChange?.(componentId);
  };

  if (loading) {
    return (
      <Paper className={classes.root}>
        <Typography variant="body2" className={classes.placeholder}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper className={classes.root}>
      {/* Organization Dropdown */}
      <Box className={classes.dropdown}>
        <Button
          className={classes.dropdownButton}
          onClick={handleOrgClick}
          endIcon={<ArrowDropDown className={classes.arrow} />}
          disabled={organizations.length === 0}
        >
          {selectedOrg ? selectedOrg.name : 'Select Organization'}
        </Button>
      </Box>

      <Menu
        anchorEl={orgAnchor}
        open={Boolean(orgAnchor)}
        onClose={() => setOrgAnchor(null)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem className={classes.menuItem} onClick={() => handleOrgSelect(undefined)}>
          <Typography variant="body2" className={classes.placeholder}>
            All Organizations
          </Typography>
        </MenuItem>
        {organizations.length > 0 && <Divider />}
        {organizations.map((org) => (
          <MenuItem
            key={org.id}
            className={`${classes.menuItem} ${selectedOrganization === org.id ? classes.selected : ''}`}
            onClick={() => handleOrgSelect(org.id)}
          >
            <Box>
              <Typography variant="body2">{org.name}</Typography>
              {org.description && (
                <Typography variant="caption" color="textSecondary">
                  {org.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Project Section - Always rendered, visibility controlled */}
      <Box
        key="project-section"
        className={`${classes.dropdownSection} ${showProjectSection ? classes.visible : classes.hidden}`}
      >
        <ChevronRight className={classes.separator} />

        {/* Project Dropdown */}
        <Box className={classes.dropdown}>
          <Button
            className={classes.dropdownButton}
            onClick={handleProjectClick}
            endIcon={<ArrowDropDown className={classes.arrow} />}
            disabled={projects.length === 0 || !showProjectSection}
          >
            {selectedProj ? selectedProj.name : 'Select Project'}
          </Button>
        </Box>

        <Menu
          anchorEl={projectAnchor}
          open={Boolean(projectAnchor) && showProjectSection}
          onClose={() => setProjectAnchor(null)}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <MenuItem className={classes.menuItem} onClick={() => handleProjectSelect(undefined)}>
            <Typography variant="body2" className={classes.placeholder}>
              All Projects
            </Typography>
          </MenuItem>
          {projects.length > 0 && <Divider />}
          {projects.map((project) => (
            <MenuItem
              key={project.id}
              className={`${classes.menuItem} ${selectedProject === project.id ? classes.selected : ''}`}
              onClick={() => handleProjectSelect(project.id)}
            >
              <Box>
                <Typography variant="body2">{project.name}</Typography>
                {project.description && (
                  <Typography variant="caption" color="textSecondary">
                    {project.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Component Section - Always rendered, visibility controlled */}
      <Box
        key="component-section"
        className={`${classes.dropdownSection} ${showComponentSection ? classes.visible : classes.hidden}`}
      >
        <ChevronRight className={classes.separator} />

        <Box className={classes.dropdown}>
          <Button
            className={classes.dropdownButton}
            onClick={handleComponentClick}
            endIcon={<ArrowDropDown className={classes.arrow} />}
            disabled={components.length === 0 || !showComponentSection}
          >
            {selectedComp ? selectedComp.name : 'Select Component'}
          </Button>
        </Box>

        <Menu
          anchorEl={componentAnchor}
          open={Boolean(componentAnchor) && showComponentSection}
          onClose={() => setComponentAnchor(null)}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <MenuItem className={classes.menuItem} onClick={() => handleComponentSelect(undefined)}>
            <Typography variant="body2" className={classes.placeholder}>
              All Components
            </Typography>
          </MenuItem>
          {components.length > 0 && <Divider />}
          {components.map((component) => (
            <MenuItem
              key={component.id}
              className={`${classes.menuItem} ${selectedComponent === component.id ? classes.selected : ''}`}
              onClick={() => handleComponentSelect(component.id)}
            >
              <Box>
                <Typography variant="body2">{component.name}</Typography>
                {component.description && (
                  <Typography variant="caption" color="textSecondary">
                    {component.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Paper>
  );
});