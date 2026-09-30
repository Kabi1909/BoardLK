import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Animate presentation without remounting routes, forms, or conversation state.
export function usePageEntrance() {
  const ref = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const element = ref.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element?.animate || preference.matches) return;
    const animation = element.animate([{ opacity: 0.35 }, { opacity: 1 }], {
      duration: 700,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
    const stop = () => animation.cancel();
    preference.addEventListener('change', stop);
    element.addEventListener('focusin', stop, { once: true });
    return () => {
      animation.cancel();
      preference.removeEventListener('change', stop);
      element.removeEventListener('focusin', stop);
    };
  }, [pathname]);
  return ref;
}
