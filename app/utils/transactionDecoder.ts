import { fromBase64 } from "@cosmjs/encoding";
import { Any } from "cosmjs-types/google/protobuf/any";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

interface DecodedTransaction {
  type: string;
  sender?: string;
  recipient?: string;
  amount?: string;
  denom?: string;
  validators?: string[];
  delegator?: string;
  rawData: string;
}

// Map of transaction type URLs to friendly names
const TX_TYPE_NAMES: Record<string, string> = {
  "/cosmos.bank.v1beta1.MsgSend": "Send"
};

// Helper function to format transaction type
function formatTransactionType(type: string): string {
  if (type in TX_TYPE_NAMES) {
    return TX_TYPE_NAMES[type];
  }
  
  // Extract the last part of the type URL
  const parts = type.split('.');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    // Remove "Msg" prefix if present
    return lastPart.replace(/^Msg/, '');
  }
  
  return type;
}

export function decodeTransaction(base64Data: string): DecodedTransaction {
  try {
    // Check if the input is valid base64
    if (!base64Data || typeof base64Data !== 'string') {
      return { type: "Invalid Data", rawData: base64Data || "" };
    }
    
    // Check if the data is already in a readable format (e.g., JSON)
    if (base64Data.includes('{') && base64Data.includes('}')) {
      try {
        // Try to parse as JSON
        const jsonData: { [key: string]: any } = JSON.parse(base64Data);
        
        // Try to extract transaction type and details from JSON
        if (jsonData.type && jsonData.type.includes('/')) {
          const formattedType = formatTransactionType(jsonData.type);
          
          // Create and return the decoded transaction directly
          return {
            type: formattedType,
            rawData: base64Data,
          };
        }
      } catch (jsonError) {
        // Continue with base64 decoding
      }
    }
    
    // Decode the base64 data
    let txBytes;
    try {
      txBytes = fromBase64(base64Data);
    } catch (e) {
      return { type: "Invalid Base64", rawData: base64Data };
    }
    
    // Try to decode as Any message
    try {
      const anyMessage = Any.decode(txBytes);
      
      // Get friendly name for the transaction type
      const friendlyType = formatTransactionType(anyMessage.typeUrl);
      
      // Create the decoded transaction
      const decoded: DecodedTransaction = {
        type: friendlyType,
        rawData: base64Data,
      };

      if (anyMessage.typeUrl === "/cosmos.bank.v1beta1.MsgSend") {
        const msgSend = MsgSend.decode(anyMessage.value);
        
        decoded.type = "Send";
        decoded.sender = msgSend.fromAddress;
        decoded.recipient = msgSend.toAddress;
        decoded.amount = msgSend.amount[0]?.amount;
        decoded.denom = msgSend.amount[0]?.denom;
      }

      return decoded;
    } catch (anyError) {
      // Fallback for unknown transaction types
      return {
        type: "Unknown",
        rawData: base64Data,
      };
    }
  } catch (error) {
    return { 
      type: "Error Decoding", 
      rawData: base64Data 
    };
  }
}
