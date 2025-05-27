'use client';

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify?: (token: string) => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

const Turnstile = ({
  siteKey,
  onVerify,
  action,
  theme = 'dark',
  size = 'normal',
  className = '',
}: TurnstileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Ensure window.turnstile is available
    if (!window.turnstile) {
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          renderWidget();
        }
      }, 100);
      
      return () => clearInterval(checkTurnstile);
    } else {
      renderWidget();
    }

    function renderWidget() {
      if (!containerRef.current) return;
      
      // Reset if already rendered
      if (widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }

      // Render the widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify && onVerify(token);
        },
        'theme': theme,
        'size': size,
        'action': action,
      });
    }

    return () => {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onVerify, action, theme, size]);

  return <div ref={containerRef} className={className} />;
};

export default Turnstile;
