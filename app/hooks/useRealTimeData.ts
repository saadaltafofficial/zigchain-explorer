import { useState, useEffect } from 'react';
import { 
  wsService, 
  WebSocketEventType, 
  NewBlockEvent, 
  NewTransactionEvent, 
  ChainInfoEvent, 
  ConnectionStatusEvent 
} from '../services/websocket';

interface UseRealTimeDataOptions<TBlock = NewBlockEvent, TTx = NewTransactionEvent, TChainInfo = ChainInfoEvent> {
  subscribeToBlocks?: boolean;
  subscribeToTransactions?: boolean;
  subscribeToChainInfo?: boolean;
  initialBlocks?: TBlock[];
  initialTransactions?: TTx[];
  initialChainInfo?: TChainInfo | null;
  maxBlocks?: number;
  maxTransactions?: number;
}

interface UseRealTimeDataResult<TBlock = NewBlockEvent, TTx = NewTransactionEvent, TChainInfo = ChainInfoEvent> {
  blocks: TBlock[];
  transactions: TTx[];
  chainInfo: TChainInfo | null;
  connectionStatus: ConnectionStatusEvent;
  isConnected: boolean;
  error: string | null;
}

/**
 * A custom hook for subscribing to real-time blockchain data via WebSockets
 */
export function useRealTimeData<TBlock = NewBlockEvent, TTx = NewTransactionEvent, TChainInfo = ChainInfoEvent>(
  options: UseRealTimeDataOptions<TBlock, TTx, TChainInfo> = {}
): UseRealTimeDataResult<TBlock, TTx, TChainInfo> {
  const {
    subscribeToBlocks = true,
    subscribeToTransactions = true,
    subscribeToChainInfo = true,
    initialBlocks = [],
    initialTransactions = [],
    initialChainInfo = null,
    maxBlocks = 10,
    maxTransactions = 10
  } = options;

  const [blocks, setBlocks] = useState<NewBlockEvent[]>(initialBlocks);
  const [transactions, setTransactions] = useState<NewTransactionEvent[]>(initialTransactions);
  const [chainInfo, setChainInfo] = useState<ChainInfoEvent | null>(initialChainInfo);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusEvent>({
    connected: false,
    reconnecting: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle new blocks
    const handleNewBlock = (block: NewBlockEvent) => {
      if (subscribeToBlocks) {
        setBlocks(prevBlocks => {
          // Check if we already have this block
          if (prevBlocks.some(b => b.height === block.height)) {
            return prevBlocks;
          }
          // Add the new block to the beginning and limit to maxBlocks
          return [block, ...prevBlocks].slice(0, maxBlocks);
        });
      }
    };

    // Handle new transactions
    const handleNewTransaction = (tx: NewTransactionEvent) => {
      if (subscribeToTransactions) {
        setTransactions(prevTxs => {
          // Check if we already have this transaction
          if (prevTxs.some(t => t.hash === tx.hash)) {
            return prevTxs;
          }
          // Add the new transaction to the beginning and limit to maxTransactions
          return [tx, ...prevTxs].slice(0, maxTransactions);
        });
      }
    };

    // Handle chain info updates
    const handleChainInfo = (info: Partial<ChainInfoEvent>) => {
      if (subscribeToChainInfo) {
        setChainInfo(prevInfo => {
          if (!prevInfo) return info as ChainInfoEvent;
          return { ...prevInfo, ...info };
        });
      }
    };

    // Handle connection status updates
    const handleConnectionStatus = (status: ConnectionStatusEvent) => {
      setConnectionStatus(status);
      
      if (!status.connected && !status.reconnecting && status.error) {
        setError(`WebSocket connection error: ${status.error}`);
      } else if (status.connected) {
        setError(null);
      }
    };

    // Register event listeners
    wsService.on(WebSocketEventType.NewBlock, handleNewBlock);
    wsService.on(WebSocketEventType.NewTransaction, handleNewTransaction);
    wsService.on(WebSocketEventType.ChainInfo, handleChainInfo);
    wsService.on(WebSocketEventType.ConnectionStatus, handleConnectionStatus);

    // Subscribe to events
    if (subscribeToBlocks) {
      wsService.subscribe('tm.event=\'NewBlock\'');
    }
    
    if (subscribeToTransactions) {
      wsService.subscribe('tm.event=\'Tx\'');
    }

    // Connect to WebSocket
    wsService.connect();

    // Clean up on unmount
    return () => {
      wsService.off(WebSocketEventType.NewBlock, handleNewBlock);
      wsService.off(WebSocketEventType.NewTransaction, handleNewTransaction);
      wsService.off(WebSocketEventType.ChainInfo, handleChainInfo);
      wsService.off(WebSocketEventType.ConnectionStatus, handleConnectionStatus);
      
      // Note: We don't disconnect or unsubscribe here as other components
      // might still be using the WebSocket connection
    };
  }, [
    subscribeToBlocks, 
    subscribeToTransactions, 
    subscribeToChainInfo, 
    maxBlocks, 
    maxTransactions
  ]);

  return {
    blocks,
    transactions,
    chainInfo,
    connectionStatus,
    isConnected: connectionStatus.connected,
    error
  };
}
