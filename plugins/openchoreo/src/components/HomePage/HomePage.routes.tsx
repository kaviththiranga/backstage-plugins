import { Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';

export const HomePageRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<HomePage />} />

      {/* Organization routes */}
      <Route path="/org/:orgId/overview" element={<HomePage />} />
      <Route path="/org/:orgId/projects" element={<HomePage />} />
      <Route path="/org/:orgId/analytics" element={<HomePage />} />
      <Route path="/org/:orgId/settings" element={<HomePage />} />

      {/* Project routes */}
      <Route path="/org/:orgId/project/:projectId/overview" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/components" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/builds" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/deploy" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/docs" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/analytics" element={<HomePage />} />

      {/* Component routes */}
      <Route path="/org/:orgId/project/:projectId/component/:componentId/overview" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/component/:componentId/builds" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/component/:componentId/deploy" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/component/:componentId/docs" element={<HomePage />} />
      <Route path="/org/:orgId/project/:projectId/component/:componentId/settings" element={<HomePage />} />

      {/* Redirect any other paths to root */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};