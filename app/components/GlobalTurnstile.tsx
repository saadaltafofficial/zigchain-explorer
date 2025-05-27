'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

interface GlobalTurnstileProps {
  siteKey: string;
}

const GlobalTurnstile = ({ siteKey }: GlobalTurnstileProps) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const router = useRouter();

  // Check if user has already been verified and if verification is needed
  useEffect(() => {
    const checkVerification = async () => {
      // Check if already verified and not expired
      const hasVerified = localStorage.getItem('turnstile_verified');
      const expiryTime = localStorage.getItem('turnstile_verified_expiry');
      const now = Date.now();
      
      if (hasVerified === 'true' && expiryTime && parseInt(expiryTime) > now) {
        setIsVerified(true);
        setIsModalOpen(false);
        return;
      }
      
      // If verification has expired or doesn't exist, check if we need to verify
      try {
        // Make a request to any page to check if the middleware flags it
        const response = await fetch('/', { method: 'HEAD' });
        const needsVerification = response.headers.get('x-verify-turnstile') === 'true';
        
        // Always show on first visit (no localStorage entry) or if flagged by middleware
        if (!hasVerified || needsVerification) {
          setIsVerified(false);
          setIsModalOpen(true);
          // Clear any existing verification if it's flagged as suspicious
          if (needsVerification) {
            localStorage.removeItem('turnstile_verified');
            localStorage.removeItem('turnstile_verified_expiry');
          }
        } else {
          setIsVerified(true);
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };
    
    checkVerification();
  }, []);

  // Define the callback function that will be called when the script loads
  useEffect(() => {
    // Define the global callback function that Turnstile will call when loaded
    window.onloadGlobalTurnstileCallback = function() {
      if (containerRef.current && window.turnstile && !isVerified) {
        // Render the widget using the explicit rendering method
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: function(token) {
            console.log('Turnstile verification successful');
            verifyToken(token);
          },
          theme: 'dark',
          'expired-callback': function() {
            console.log('Turnstile token expired');
            setIsVerified(false);
            setIsModalOpen(true);
          },
          'error-callback': function() {
            console.log('Turnstile encountered an error');
          }
        });
      }
    };

    // Clean up function
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      // @ts-ignore - Clean up global callback
      window.onloadGlobalTurnstileCallback = undefined;
    };
  }, [siteKey, isVerified]);

  // Verify the token with the server
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        setIsModalOpen(false);
        // Store verification status in localStorage
        localStorage.setItem('turnstile_verified', 'true');
        // Set an expiration time (e.g., 24 hours)
        const expirationTime = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('turnstile_verified_expiry', expirationTime.toString());
      } else {
        console.error('Turnstile verification failed:', data.error);
        // Reset the widget if verification fails
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    } catch (error) {
      console.error('Error verifying Turnstile token:', error);
    }
  };

  // If already verified, don't show anything
  if (isVerified && !isModalOpen) {
    return null;
  }

  return (
    <>
      {/* Load the Turnstile script with the onload callback */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadGlobalTurnstileCallback"
        strategy="afterInteractive"
      />
      
      {/* Modal overlay for the verification challenge */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-white">Verify You're Human</h2>
            <p className="mb-4 text-gray-300">
              Please complete the security check below to continue to ZigChain Explorer.
            </p>
            
            {/* Container for the Turnstile widget */}
            <div className="flex justify-center my-6">
              <div ref={containerRef} id="global-turnstile-container" />
            </div>
            
            <p className="text-sm text-gray-400 text-center mt-4">
              This helps us protect our site from bots and malicious activity.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalTurnstile;
