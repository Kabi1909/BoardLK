import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar, DashboardTopbar } from '../components/dashboard/DashboardComponents';
import { usePageEntrance } from '../hooks/usePageEntrance';
export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const pageRef = usePageEntrance();
  const isMessages = useLocation().pathname.endsWith('/messages');
  return (
    <div className="dashboard-layout">
      <DashboardSidebar open={open} onClose={() => setOpen(false)} />
      <div className={'dashboard-main' + (isMessages ? ' messages-workspace' : '')}>
        <DashboardTopbar onMenu={() => setOpen(true)} />
        <main className="dashboard-content" id="main-content" ref={pageRef}>
          <Outlet />
        </main>
        <div className="dashboard-footer">BoardLK · A place for your next chapter.</div>
      </div>
    </div>
  );
}
