import {Outlet,useLocation} from 'react-router-dom';
import {useEffect} from 'react';
import {Navbar,Footer} from '../components/common/Navigation';
export function ScrollToTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);},[pathname]);return null;}
export default function PublicLayout(){return <><Navbar/><main id="main-content"><Outlet/></main><Footer/></>;}
