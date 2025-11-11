import React from 'react';
import { LayoutTemplate } from '@backstage/plugin-scaffolder-react';
import {
  Typography,
  Box,
  Divider,
  makeStyles,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(4),
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  divider: {
    marginBottom: theme.spacing(3),
  },
  fieldWrapper: {
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(3),
    },
  },
}));

/**
 * SectionLayout - Enhanced layout with clear section headers and dividers
 *
 * Features:
 * - Large, bold section title
 * - Descriptive text under title
 * - Horizontal divider for visual separation
 * - Vertical spacing between fields
 * - Clean, professional appearance
 */
export const SectionLayout: LayoutTemplate = ({
  properties,
  title,
  description,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      {(title || description) && (
        <Box className={classes.header}>
          {title && (
            <Typography variant="h4" className={classes.title}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body1" className={classes.description}>
              {description}
            </Typography>
          )}
          <Divider className={classes.divider} />
        </Box>
      )}

      <Box className={classes.fieldWrapper}>
        {properties.map((prop) => (
          <Box key={prop.content.key}>
            {prop.content}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
