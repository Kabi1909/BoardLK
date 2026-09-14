import {useState} from 'react';
import {Outlet} from 'react-router-dom';
import {DashboardSidebar,DashboardTopbar} from '../components/dashboard/DashboardComponents';
export default function DashboardLayout(){const [open,setOpen]=useState(false);return <div className="dashboard-layout"><DashboardSidebar open={open} onClose={()=>setOpen(false)}/><div className="dashboard-main"><DashboardTopbar onMenu={()=>setOpen(true)}/><main className="dashboard-content" id="main-content"><Outlet/></main><div className="dashboard-footer">BoardLK · A place for your next chapter.</div></div></div>;}
