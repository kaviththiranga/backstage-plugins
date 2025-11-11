import React from 'react';
import { LayoutTemplate } from '@backstage/plugin-scaffolder-react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  makeStyles,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  description: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  card: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  fieldWrapper: {
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(2),
    },
  },
}));

/**
 * CardGroupLayout - Displays form fields grouped in Material-UI cards
 *
 * Features:
 * - Each field or group of fields in a card
 * - Visual separation with elevation
 * - Clean, organized appearance
 * - Section title and description at top
 */
export const CardGroupLayout: LayoutTemplate = ({
  properties,
  title,
  description,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      {title && (
        <Typography variant="h5" className={classes.title}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" className={classes.description}>
          {description}
        </Typography>
      )}

      {properties.map((prop) => (
        <Card
          key={prop.content.key}
          className={classes.card}
          elevation={2}
        >
          <CardContent className={classes.fieldWrapper}>
            {prop.content}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
