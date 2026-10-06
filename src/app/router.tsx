import { PostsPage } from '../pages/PostsPage';
import { createBrowserRouter, Navigate, Outlet, useRouteError } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { WorkspaceProvider } from '../features/workspace/WorkspaceProvider';
import { ToastProvider } from '../components/ui/Toast';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AutomationsPage } from '../pages/AutomationsPage';
import { AutomationEditorPage } from '../pages/AutomationEditorPage';
import { DeliveriesPage } from '../pages/DeliveriesPage';
import { InstagramSettingsPage } from '../pages/InstagramSettingsPage';
import { LoaderCircle } from 'lucide-react';

function Root() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </AuthProvider>
  );
}
function Protected() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <div className="full-loading">
        <LoaderCircle className="spin" />
        계정을 확인하고 있어요
      </div>
    );
  if (!session) return <Navigate to="/login" replace />;
  return (
    <WorkspaceProvider key={session.workspaceId}>
      <AppLayout />
    </WorkspaceProvider>
  );
}
function RouteError() {
  const error = useRouteError();
  return (
    <div className="full-loading">
      <h1>화면을 불러오지 못했어요</h1>
      <p>{error instanceof Error ? error.message : '페이지 주소와 연결 상태를 확인해 주세요.'}</p>
      <a className="button button-primary" href="/dashboard">
        대시보드로 돌아가기
      </a>
    </div>
  );
}
export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <Protected />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/posts', element: <PostsPage /> },
          { path: '/automations', element: <AutomationsPage /> },
          { path: '/automations/new', element: <AutomationEditorPage /> },
          { path: '/automations/:id/edit', element: <AutomationEditorPage /> },
          { path: '/deliveries', element: <DeliveriesPage /> },
          { path: '/settings/instagram', element: <InstagramSettingsPage /> },
          {
            path: '*',
            element: (
              <div className="empty-state">
                <h1>페이지를 찾을 수 없어요</h1>
                <a href="/dashboard">대시보드로 이동</a>
              </div>
            ),
          },
        ],
      },
    ],
  },
]);
