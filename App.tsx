import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Tracker from './pages/Tracker';
import Discovery from './pages/Discovery';
import ProjectDetails from './pages/ProjectDetails';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/signals" element={<Discovery />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;