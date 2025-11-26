import React from 'react';
import { useParams } from 'react-router-dom';
import MaintenanceHistoryViewer from '../components/MaintenanceHistoryViewer';

const MaintenanceHistoryPage = () => {
  const { transformerNo } = useParams();

  return (
    <MaintenanceHistoryViewer 
      transformerNo={transformerNo}
    />
  );
};

export default MaintenanceHistoryPage;
