import axios from 'axios';
import { fromBase64 } from "@cosmjs/encoding";
import { sha256 } from "@cosmjs/crypto";

// Use the RPC URL from environment variable
const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.zigchain.com' || 'http://localhost:26657';

export interface Transaction {
  hash: string;
  height: string;
  time: string;
  tx: string;
  tx_result: {
    code: number;
    gas_used: string;
    gas_wanted: string;
    log: string;
  };
  status?: 'success' | 'failed';
  from?: string;
  to?: string;
  amount?: string;
}

/**
 * Fetches transactions from the blockchain
 * @param blocksBack Number of blocks to go back from the latest block
 * @param limit Maximum number of transactions to return
 * @returns Array of transactions
 */
export const fetchTransactions = async (blocksBack = 50, limit = 10): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions from last ${blocksBack} blocks, limit: ${limit}`);
    
    // Step 1: Get latest block height
    const latestBlockResponse = await axios.get(`${RPC_URL}/status`);
    const latestBlock = parseInt(latestBlockResponse.data.result.sync_info.latest_block_height);

    const startBlock = latestBlock;
    const endBlock = Math.max(1, latestBlock - blocksBack); // Going back specified number of blocks

    console.log(`Fetching blocks from ${endBlock} to ${startBlock}...`);

    const allTransactions: Transaction[] = [];

    // Step 2: Fetch transactions from latestBlock to (latestBlock - blocksBack)
    for (let currentBlock = startBlock; currentBlock >= endBlock && allTransactions.length < limit; currentBlock--) {
      const response = await axios.get(`${RPC_URL}/block?height=${currentBlock}`);
      const txs = response.data.result.block.data.txs || [];
      const blockTime = response.data.result.block.header.time;

      if (txs && txs.length > 0) {
        // Step 3: Decode transactions and compute hashes
        for (const tx of txs) {
          if (allTransactions.length >= limit) break;
          
          const decodedTx = fromBase64(tx);
          const txHash = Buffer.from(sha256(decodedTx)).toString("hex").toUpperCase();

          // Get more details about the transaction
          try {
            const txResponse = await axios.get(`${RPC_URL}/tx`, {
              params: { hash: `0x${txHash}` }
            });

            if (txResponse.data && txResponse.data.result) {
              const txData = txResponse.data.result;
              
              // Extract sender and receiver from events if available
              let sender = null;
              let receiver = null;
              let amount = null;
              
              if (txData.tx_result && txData.tx_result.events) {
                // Look for transfer events
                const transferEvents = txData.tx_result.events.filter((event: { type: string }) => event.type === 'transfer');
                
                if (transferEvents.length > 0) {
                  const transferEvent = transferEvents[0];
                  
                  // Extract sender and recipient from attributes
                  const senderAttr = transferEvent.attributes.find((attr: { key: string; value: string }) => attr.key === 'sender');
                  const recipientAttr = transferEvent.attributes.find((attr: { key: string; value: string }) => attr.key === 'recipient');
                  const amountAttr = transferEvent.attributes.find((attr: { key: string; value: string }) => attr.key === 'amount');
                  
                  if (senderAttr && senderAttr.value) {
                    sender = senderAttr.value;
                  }
                  
                  if (recipientAttr && recipientAttr.value) {
                    receiver = recipientAttr.value;
                  }
                  
                  if (amountAttr && amountAttr.value) {
                    amount = amountAttr.value;
                  }
                }
              }

              allTransactions.push({
                hash: txHash,
                height: currentBlock.toString(),
                time: blockTime,
                tx: tx,
                tx_result: {
                  code: txData.tx_result.code || 0,
                  gas_used: txData.tx_result.gas_used || "0",
                  gas_wanted: txData.tx_result.gas_wanted || "0",
                  log: txData.tx_result.log || ""
                },
                status: txData.tx_result.code === 0 ? 'success' : 'failed',
                from: sender,
                to: receiver,
                amount: amount
              });
            }
          } catch (txError) {
            console.error(`Error fetching transaction details:`, txError);
            
            // Add basic transaction info without details
            allTransactions.push({
              hash: txHash,
              height: currentBlock.toString(),
              time: blockTime,
              tx: tx,
              tx_result: {
                code: 0,
                gas_used: "0",
                gas_wanted: "0",
                log: ""
              }
            });
          }
        }
      }
    }

    console.log(`Found ${allTransactions.length} transactions`);
    return allTransactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

/**
 * Fetches a single transaction by its hash
 * @param hash Transaction hash
 * @returns Transaction details or null if not found
 */
export const fetchTransactionByHash = async (hash: string): Promise<Transaction | null> => {
  try {
    console.log(`Fetching transaction with hash: ${hash}`);
    
    // Format the hash properly if needed (add 0x prefix if not present)
    const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
    
    // Fetch the transaction details
    const txResponse = await axios.get(`${RPC_URL}/tx`, {
      params: { hash: formattedHash }
    });
    
    if (!txResponse.data || !txResponse.data.result) {
      console.error('Transaction not found or invalid response format');
      return null;
    }
    
    const txData = txResponse.data.result;
    
    // Extract block height to fetch the block time
    const height = txData.height;
    
    // Fetch the block to get the timestamp
    const blockResponse = await axios.get(`${RPC_URL}/block`, {
      params: { height }
    });
    
    const blockTime = blockResponse.data.result.block.header.time;
    
    // Extract sender and receiver from events if available
    let sender = null;
    let receiver = null;
    let amount = null;
    
    if (txData.tx_result && txData.tx_result.events) {
      // Look for transfer events
      const transferEvents = txData.tx_result.events.filter((event: { type: string }) => event.type === 'transfer');
      
      if (transferEvents.length > 0) {
        const transferEvent = transferEvents[0];
        
        // Extract sender and recipient from attributes
        const senderAttr = transferEvent.attributes.find((attr: { key: string; value: string }) => attr.key === 'sender');
        const recipientAttr = transferEvent.attributes.find((attr: { key: string; value: string }) => attr.key === 'recipient');
        const amountAttr = transferEvent.attributes.find((attr: { key: string; value: string }) => attr.key === 'amount');
        
        if (senderAttr && senderAttr.value) {
          sender = senderAttr.value;
        }
        
        if (recipientAttr && recipientAttr.value) {
          receiver = recipientAttr.value;
        }
        
        if (amountAttr && amountAttr.value) {
          amount = amountAttr.value;
        }
      }
    }
    
    // Create the transaction object
    const transaction: Transaction = {
      hash: hash.toUpperCase(),
      height: height.toString(),
      time: blockTime,
      tx: txData.tx,
      tx_result: {
        code: txData.tx_result.code || 0,
        gas_used: txData.tx_result.gas_used || "0",
        gas_wanted: txData.tx_result.gas_wanted || "0",
        log: txData.tx_result.log || ""
      },
      status: txData.tx_result.code === 0 ? 'success' : 'failed',
      from: sender,
      to: receiver,
      amount: amount
    };
    
    return transaction;
  } catch (error) {
    console.error("Error fetching transaction by hash:", error);
    return null;
  }
};
