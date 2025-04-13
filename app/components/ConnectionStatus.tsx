import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  isReconnecting = false 
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      {isConnected ? (
        <>
          <Wifi size={14} className="text-green-500 animate-pulse" />
          <span className="text-green-600 dark:text-green-400">Live</span>
        </>
      ) : isReconnecting ? (
        <>
          <Wifi size={14} className="text-amber-500 animate-pulse" />
          <span className="text-amber-600 dark:text-amber-400">Connecting...</span>
        </>
      ) : (
        <>
          <WifiOff size={14} className="text-red-500" />
          <span className="text-red-600 dark:text-red-400">Offline</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
