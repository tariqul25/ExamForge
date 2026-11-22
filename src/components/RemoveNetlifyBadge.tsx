'use client';

import { useEffect } from 'react';

export default function RemoveNetlifyBadge() {
  useEffect(() => {
    const removeBadge = () => {
      const selectors = [
        'netlify-drawer',
        '#netlify-drawer',
        '[data-netlify-drawer]',
        'iframe[title*="Netlify" i]',
        'iframe[id*="netlify" i]',
        '.netlify-badge',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      });

      // Remove any fixed anchor linking to netlify
      document.querySelectorAll('a[href*="netlify.com"]').forEach((a) => {
        const style = window.getComputedStyle(a);
        if (style.position === 'fixed' || style.position === 'absolute') {
          a.remove();
        }
      });
    };

    removeBadge();
    const interval = setInterval(removeBadge, 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
