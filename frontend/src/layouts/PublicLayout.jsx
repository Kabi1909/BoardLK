import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar, Footer } from '../components/common/Navigation';
import { usePageEntrance } from '../hooks/usePageEntrance';
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function PublicLayout() {
  const pageRef = usePageEntrance();
  return (
    <>
      <Navbar />
      <main id="main-content" ref={pageRef}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
