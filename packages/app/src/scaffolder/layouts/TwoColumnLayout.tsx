import React from 'react';
import { LayoutTemplate } from '@backstage/plugin-scaffolder-react';
import { Grid, Typography, Box } from '@material-ui/core';

/**
 * TwoColumnLayout - Displays form fields in a responsive two-column grid
 *
 * Features:
 * - Two columns on medium+ screens (md and up)
 * - Single column on mobile
 * - Section title and description
 * - Proper spacing between fields
 */
export const TwoColumnLayout: LayoutTemplate = ({
  properties,
  title,
  description,
}) => {
  return (
    <Box>
      {title && (
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="textSecondary" paragraph>
          {description}
        </Typography>
      )}

      <Grid container spacing={3}>
        {properties.map((prop) => (
          <Grid
            item
            xs={12}
            md={6}
            key={prop.content.key}
          >
            {prop.content}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
