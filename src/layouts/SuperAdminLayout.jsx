import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from '../components/SuperAdminSidebar';

export default function SuperAdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SuperAdminSidebar />
      <main style={{
        flex: 1,
        marginLeft: '260px',
        background: '#f8fafc',
        minHeight: '100vh'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
