'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface TurnstileProps {
  siteKey: string;
  onVerify?: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

const Turnstile = ({
  siteKey,
  onVerify,
  theme = 'dark',
  size = 'normal',
  className = '',
}: TurnstileProps) => {
  // Define callback function for Turnstile
  useEffect(() => {
    // Create global callback function
    window.turnstileCallback = (token: string) => {
      console.log('Turnstile verified with token:', token);
      if (onVerify) onVerify(token);
    };

    return () => {
      // @ts-ignore - Clean up global callback
      window.turnstileCallback = undefined;
    };
  }, [onVerify]);

  return (
    <>
      {/* Load Turnstile script directly in the component */}
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      
      {/* Turnstile container */}
      <div 
        className={`cf-turnstile ${className}`}
        data-sitekey={siteKey}
        data-callback="turnstileCallback"
        data-theme={theme}
        data-size={size}
      />
    </>
  );
};

export default Turnstile;
