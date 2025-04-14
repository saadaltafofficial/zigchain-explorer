import { EventEmitter } from 'events';

// Define event types
export enum RealTimeEventType {
  NewBlock = 'NewBlock',
  NewTransaction = 'NewTransaction',
  ChainUpdate = 'ChainUpdate',
  ConnectionStatus = 'ConnectionStatus'
}

// Connection status type
export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
}

// WebSocket service class
class RealTimeService {
  private static instance: RealTimeService;
  private socket: WebSocket | null = null;
  private eventEmitter = new EventEmitter();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 2000; // Start with 2 seconds
  private url: string;
  private isConnected = false;
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Get the WebSocket URL from environment or use default
    this.url = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://167.86.79.37:26657/websocket';
  }

  public static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return; // Already connected or connecting
    }

    if (this.isConnecting) {
      return; // Already attempting to connect
    }

    this.isConnecting = true;

    try {
      console.log(`Connecting to WebSocket at ${this.url}`);
      this.socket = new WebSocket(this.url);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    this.emitConnectionStatus({
      connected: false,
      reconnecting: false
    });
  }

  public subscribe(eventType: string): void {
    if (!this.isConnected) {
      // Connect first, then subscribe when connected
      this.connect();
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const subscribeMessage = JSON.stringify({
        jsonrpc: "2.0",
        method: "subscribe",
        params: {
          query: eventType
        },
        id: Date.now()
      });
      
      this.socket.send(subscribeMessage);
      console.log(`Subscribed to ${eventType}`);
    }
  }

  public on(event: RealTimeEventType, listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  public off(event: RealTimeEventType, listener: (data: any) => void): void {
    this.eventEmitter.off(event, listener);
  }

  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Subscribe to common events
    this.subscribe('tm.event=\'NewBlock\'');
    this.subscribe('tm.event=\'Tx\'');
    
    this.emitConnectionStatus({
      connected: true,
      reconnecting: false
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle subscription confirmations
      if (data.id && data.result) {
        console.log('Subscription confirmed:', data);
        return;
      }
      
      // Handle actual events
      if (data.result && data.result.data && data.result.data.value) {
        const eventData = data.result.data.value;
        const eventType = data.result.data.type;
        
        switch (eventType) {
          case 'tendermint/event/NewBlock':
            this.handleNewBlock(eventData);
            break;
          case 'tendermint/event/Tx':
            this.handleNewTransaction(eventData);
            break;
          default:
            console.log('Received event:', eventType, eventData);
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  private handleNewBlock(data: any): void {
    try {
      const blockData = data.block || data;
      const header = blockData.header;
      
      const block = {
        height: parseInt(header.height),
        hash: blockData.block_id?.hash || '',
        time: header.time,
        proposer: header.proposer_address,
        numTxs: blockData.data?.txs ? blockData.data.txs.length : 0
      };
      
      this.eventEmitter.emit(RealTimeEventType.NewBlock, block);
      
      // Also emit a chain update when we get a new block
      this.eventEmitter.emit(RealTimeEventType.ChainUpdate, {
        blockHeight: block.height,
        lastBlockTime: block.time
      });
    } catch (error) {
      console.error('Error handling new block:', error);
    }
  }

  private handleNewTransaction(data: any): void {
    try {
      const txData = data.TxResult || data;
      
      const tx = {
        hash: txData.tx_hash || '',
        height: txData.height,
        time: new Date().toISOString(), // Tx events might not include time
        status: txData.tx_result?.code === 0 ? 'success' : 'failed',
        tx_result: {
          code: txData.tx_result?.code || 0
        }
      };
      
      this.eventEmitter.emit(RealTimeEventType.NewTransaction, tx);
    } catch (error) {
      console.error('Error handling new transaction:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    this.isConnecting = false;
    this.socket = null;
    
    this.emitConnectionStatus({
      connected: false,
      reconnecting: true
    });
    
    this.handleReconnect();
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.emitConnectionStatus({
      connected: false,
      reconnecting: true,
      error: 'Connection error'
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, giving up');
      this.emitConnectionStatus({
        connected: false,
        reconnecting: false,
        error: 'Failed to connect after multiple attempts'
      });
      return;
    }
    
    // Exponential backoff
    const delay = Math.min(30000, this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts));
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private emitConnectionStatus(status: ConnectionStatus): void {
    this.eventEmitter.emit(RealTimeEventType.ConnectionStatus, status);
  }
}

// Export singleton instance
export const realTimeService = RealTimeService.getInstance();

// Custom hook for React components
export function useRealTime() {
  return {
    service: realTimeService,
    eventTypes: RealTimeEventType
  };
}
