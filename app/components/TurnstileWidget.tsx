'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

const TurnstileWidget = ({ 
  siteKey, 
  onVerify,
  theme = 'dark',
  size = 'normal',
  className = ''
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only load if we have access to the window object
    if (typeof window === 'undefined') return;

    // Create a function to render the widget
    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      
      // Clear any existing widgets
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.error('Error removing Turnstile widget:', e);
        }
      }
      
      try {
        // Render the widget
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: function(token) {
            onVerify(token);
          },
          theme: theme,
          size: size,
          'expired-callback': function() {
            // Reset the widget when token expires
            if (widgetIdRef.current) {
              window.turnstile.reset(widgetIdRef.current);
            }
          }
        });
      } catch (e) {
        console.error('Error rendering Turnstile widget:', e);
      }
    };

    // Check if turnstile is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Set up a global callback for when the script loads
      window.onloadTurnstileCallback = renderWidget;
    }

    // Clean up function
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.error('Error cleaning up Turnstile widget:', e);
        }
      }
      
      // Clean up global callback
      if (window.onloadTurnstileCallback === renderWidget) {
        // @ts-ignore
        window.onloadTurnstileCallback = undefined;
      }
    };
  }, [siteKey, onVerify, theme, size]);

  return (
    <div className={className}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
        strategy="afterInteractive"
      />
      <div 
        ref={containerRef} 
        className="flex justify-center"
      />
    </div>
  );
};

export default TurnstileWidget;
