import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  content: {
    padding: 0,
  },
  tabsWrapper: {
    '& [class*="BackstageHeaderTabs-tabRoot"]': {
      fontSize: '14px !important',
      fontWeight: '700 !important',
      minWidth: 120,
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& .MuiTabs-indicator': {
      height: '3px',
    },
  },
  secondaryTabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: 36,
  },
  secondaryTab: {
    textTransform: 'none' as const,
    fontSize: '0.875rem',
    fontWeight: theme.typography.fontWeightMedium as number,
    minHeight: 36,
    minWidth: 'auto',
    padding: theme.spacing(0.5, 2),
  },
  tabPanel: {
    padding: theme.spacing(3),
    '& [class*="MuiTableCell-head"]': {
      fontSize: '14px !important',
    },
  },
  verticalTabWrapper: {
    height: '100%',
    minHeight: 500,
  },
}));
