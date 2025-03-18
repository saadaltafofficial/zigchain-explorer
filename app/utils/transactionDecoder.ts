import { fromBase64 } from "@cosmjs/encoding";
import { Any } from "cosmjs-types/google/protobuf/any";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgDelegate, MsgUndelegate, MsgBeginRedelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgVote } from "cosmjs-types/cosmos/gov/v1beta1/tx";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";

interface DecodedTransaction {
  type: string;
  sender?: string;
  recipient?: string;
  amount?: string;
  denom?: string;
  messages?: any[];
  validators?: string[];
  delegator?: string;
  fee?: string;
  gas?: string;
  memo?: string;
  publicKey?: string;
  rawData: string;
  factoryData?: {
    creator?: string;
    denomName?: string;
    symbol?: string;
    uri?: string;
  };
}

// Map of transaction type URLs to friendly names
const TX_TYPE_NAMES: Record<string, string> = {
  "/cosmos.bank.v1beta1.MsgSend": "Send",
  "/cosmos.staking.v1beta1.MsgDelegate": "Delegate",
  "/cosmos.staking.v1beta1.MsgUndelegate": "Undelegate",
  "/cosmos.staking.v1beta1.MsgBeginRedelegate": "Redelegate",
  "/cosmos.gov.v1beta1.MsgVote": "Vote",
  "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward": "Claim Rewards",
  "/cosmos.crypto.secp256k1.PubKey": "Public Key",
  "/zigchain.factory.MsgCreateDenom": "Create Denom",
  "/zigchain.factory.MsgMint": "Mint Tokens",
  "/zigchain.factory.MsgBurn": "Burn Tokens",
};

/**
 * Helper function to format transaction type
 */
function formatTransactionType(type: string): string {
  // If it's a known type, return the friendly name
  if (type in TX_TYPE_NAMES) {
    return TX_TYPE_NAMES[type];
  }
  
  // If it's a URL-like type, extract the last part
  if (type.includes('/')) {
    const parts = type.split('/');
    const lastPart = parts[parts.length - 1];
    
    // If it starts with 'Msg', remove that prefix
    if (lastPart.startsWith('Msg')) {
      return lastPart.substring(3);
    }
    
    return lastPart;
  }
  
  // If it's a very long string, it might be encoded data
  if (type.length > 100) {
    return "Unknown Transaction Type";
  }
  
  return type;
}

export function decodeTransaction(base64Data: string): DecodedTransaction {
  try {
    console.log("Decoding transaction data:", base64Data);
    
    // Check if the input is valid base64
    if (!base64Data || typeof base64Data !== 'string') {
      console.error("Invalid transaction data:", base64Data);
      return { type: "Invalid Data", rawData: base64Data || "" };
    }
    
    // Check if the data is already in a readable format (e.g., JSON)
    if (base64Data.includes('{') && base64Data.includes('}')) {
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(base64Data);
        console.log("Parsed as JSON:", jsonData);
        
        // Try to extract transaction type and details from JSON
        if (jsonData.type && jsonData.type.includes('/')) {
          const formattedType = formatTransactionType(jsonData.type);
          
          let decoded: DecodedTransaction = {
            type: formattedType,
            rawData: base64Data,
          };
          
          // Extract details based on message type
          if (formattedType === 'Send' || formattedType.toLowerCase().includes('send')) {
            decoded.sender = jsonData.from_address || jsonData.fromAddress || jsonData.sender;
            decoded.recipient = jsonData.to_address || jsonData.toAddress || jsonData.recipient;
            
            if (jsonData.amount && Array.isArray(jsonData.amount) && jsonData.amount.length > 0) {
              decoded.amount = jsonData.amount[0].amount;
              decoded.denom = jsonData.amount[0].denom;
            }
          }
          
          return decoded;
        }
        
        // If we can't extract type from JSON, try to infer from content
        if (jsonData.from_address || jsonData.fromAddress) {
          return {
            type: "Send",
            sender: jsonData.from_address || jsonData.fromAddress,
            recipient: jsonData.to_address || jsonData.toAddress,
            amount: Array.isArray(jsonData.amount) && jsonData.amount.length > 0 ? jsonData.amount[0].amount : undefined,
            denom: Array.isArray(jsonData.amount) && jsonData.amount.length > 0 ? jsonData.amount[0].denom : undefined,
            rawData: base64Data,
          };
        }
      } catch (jsonError) {
        console.log("Not valid JSON, continuing with base64 decoding");
      }
    }
    
    // Try to decode the base64 data
    let binaryData;
    try {
      binaryData = fromBase64(base64Data);
      console.log("Successfully decoded base64 to binary, length:", binaryData.length);
    } catch (decodeError) {
      console.error("Error decoding base64:", decodeError);
      
      // If base64 decoding fails, try to parse the string directly
      if (base64Data.includes('zig1') || base64Data.includes('ZIG1')) {
        // This might be a raw transaction string with addresses
        const addressRegex = /(zig1[a-zA-Z0-9]{38,44})/g;
        const addresses = base64Data.match(addressRegex);
        
        if (addresses && addresses.length >= 2) {
          // Extract amount and denom if present
          const amountRegex = /([0-9]+)([a-zA-Z]+)/g;
          const amountMatch = amountRegex.exec(base64Data);
          
          return {
            type: "Send",
            sender: addresses[0],
            recipient: addresses[1],
            amount: amountMatch ? amountMatch[1] : undefined,
            denom: amountMatch ? amountMatch[2] : undefined,
            rawData: base64Data,
          };
        }
        
        // If we only found one address, it might be a validator operation
        if (addresses && addresses.length === 1) {
          return {
            type: "Validator Operation",
            sender: addresses[0],
            rawData: base64Data,
          };
        }
      }
      
      return { 
        type: "Unknown Transaction", 
        rawData: base64Data 
      };
    }
    
    // Try to decode as Any message
    try {
      const anyMessage = Any.decode(binaryData);
      console.log("Decoded as Any message, typeUrl:", anyMessage.typeUrl);
      
      // Get friendly name for the transaction type
      const friendlyType = formatTransactionType(anyMessage.typeUrl);
      
      let decoded: DecodedTransaction = {
        type: friendlyType,
        rawData: base64Data,
      };

      switch (anyMessage.typeUrl) {
        case "/cosmos.bank.v1beta1.MsgSend":
          console.log("Decoding as MsgSend");
          const msgSend = MsgSend.decode(anyMessage.value);
          console.log("MsgSend details:", {
            fromAddress: msgSend.fromAddress,
            toAddress: msgSend.toAddress,
            amount: msgSend.amount
          });
          
          decoded = {
            type: "Send",
            sender: msgSend.fromAddress,
            recipient: msgSend.toAddress,
            amount: msgSend.amount[0]?.amount,
            denom: msgSend.amount[0]?.denom,
            rawData: base64Data,
          };
          break;

        case "/cosmos.staking.v1beta1.MsgDelegate":
          console.log("Decoding as MsgDelegate");
          const msgDelegate = MsgDelegate.decode(anyMessage.value);
          console.log("MsgDelegate details:", {
            delegatorAddress: msgDelegate.delegatorAddress,
            validatorAddress: msgDelegate.validatorAddress,
            amount: msgDelegate.amount
          });
          
          decoded = {
            type: "Delegate",
            sender: msgDelegate.delegatorAddress,
            validators: [msgDelegate.validatorAddress],
            amount: msgDelegate.amount?.amount,
            denom: msgDelegate.amount?.denom,
            rawData: base64Data,
          };
          break;
          
        case "/cosmos.staking.v1beta1.MsgUndelegate":
          console.log("Decoding as MsgUndelegate");
          const msgUndelegate = MsgUndelegate.decode(anyMessage.value);
          
          decoded = {
            type: "Undelegate",
            sender: msgUndelegate.delegatorAddress,
            validators: [msgUndelegate.validatorAddress],
            amount: msgUndelegate.amount?.amount,
            denom: msgUndelegate.amount?.denom,
            rawData: base64Data,
          };
          break;
          
        case "/cosmos.staking.v1beta1.MsgBeginRedelegate":
          console.log("Decoding as MsgBeginRedelegate");
          const msgRedelegate = MsgBeginRedelegate.decode(anyMessage.value);
          
          decoded = {
            type: "Redelegate",
            sender: msgRedelegate.delegatorAddress,
            validators: [msgRedelegate.validatorSrcAddress, msgRedelegate.validatorDstAddress],
            amount: msgRedelegate.amount?.amount,
            denom: msgRedelegate.amount?.denom,
            rawData: base64Data,
          };
          break;

        case "/cosmos.gov.v1beta1.MsgVote":
          console.log("Decoding as MsgVote");
          const msgVote = MsgVote.decode(anyMessage.value);
          console.log("MsgVote details:", {
            voter: msgVote.voter,
            proposalId: msgVote.proposalId,
            option: msgVote.option
          });
          
          decoded = {
            type: "Vote",
            sender: msgVote.voter,
            rawData: base64Data,
          };
          break;
          
        case "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward":
          console.log("Decoding as MsgWithdrawDelegatorReward");
          const msgWithdraw = MsgWithdrawDelegatorReward.decode(anyMessage.value);
          
          decoded = {
            type: "Claim Rewards",
            sender: msgWithdraw.delegatorAddress,
            validators: [msgWithdraw.validatorAddress],
            rawData: base64Data,
          };
          break;

        case "/cosmos.crypto.secp256k1.PubKey":
          console.log("Decoding as PubKey");
          const pubKey = PubKey.decode(anyMessage.value);
          console.log("PubKey details:", {
            keyLength: pubKey.key.length
          });
          
          decoded = {
            type: "Public Key",
            publicKey: Buffer.from(pubKey.key).toString("hex"),
            rawData: base64Data,
          };
          break;

        default:
          console.warn("Unknown transaction type:", anyMessage.typeUrl);
          // Try to extract some information from the typeUrl
          const typeMatch = anyMessage.typeUrl.match(/\/([^.]+)\.([^.]+)\.([^.]+)\.([^.]+)/);
          if (typeMatch) {
            const msgType = typeMatch[4];
            decoded.type = msgType.replace(/^Msg/, '');
            console.log("Extracted type from typeUrl:", decoded.type);
          }
          break;
      }

      return decoded;
    } catch (anyError) {
      console.error("Error decoding as Any message:", anyError);
      
      // Try a fallback approach - look for common patterns in the binary data
      try {
        // Convert binary to hex for pattern matching
        const hexData = Buffer.from(binaryData).toString('hex');
        console.log("Converted to hex for pattern matching, length:", hexData.length);
        
        // Convert binary to text for pattern matching
        const textData = Buffer.from(binaryData).toString('utf8', 0, Math.min(binaryData.length, 1000));
        console.log("Converted to text for pattern matching (first 1000 chars):", textData);
        
        let decoded: DecodedTransaction = {
          type: "Unknown",
          rawData: base64Data,
        };
        
        // Check for Cosmos addresses in the text data
        const addressRegex = /(zig1[a-zA-Z0-9]{38,44})/g;
        const addresses = textData.match(addressRegex);
        
        if (addresses && addresses.length >= 2) {
          console.log("Found Cosmos addresses in text data:", addresses);
          
          // Extract amount and denom if present
          const amountRegex = /([0-9]+)([a-zA-Z]+)/g;
          const amountMatch = amountRegex.exec(textData);
          
          decoded = {
            type: "Send",
            sender: addresses[0],
            recipient: addresses[1],
            amount: amountMatch ? amountMatch[1] : undefined,
            denom: amountMatch ? amountMatch[2] : undefined,
            rawData: base64Data,
          };
          
          return decoded;
        }
        
        // Check for common patterns
        if (hexData.includes('62616e6b')) { // 'bank' in hex
          console.log("Found 'bank' pattern in hex data");
          decoded.type = "Bank Transaction";
        } else if (hexData.includes('7374616b696e67')) { // 'staking' in hex
          console.log("Found 'staking' pattern in hex data");
          decoded.type = "Staking Transaction";
        } else if (hexData.includes('676f7665726e616e6365')) { // 'governance' in hex
          console.log("Found 'governance' pattern in hex data");
          decoded.type = "Governance Transaction";
        } else if (hexData.includes('666163746f7279')) { // 'factory' in hex
          console.log("Found 'factory' pattern in hex data");
          decoded.type = "Factory Transaction";
        } else if (hexData.includes('64697374726962757469')) { // 'distributi' in hex
          console.log("Found 'distribution' pattern in hex data");
          decoded.type = "Distribution Transaction";
        }
        
        return decoded;
      } catch (fallbackError) {
        console.error("Fallback approach failed:", fallbackError);
        
        // Last resort: try to parse the raw string
        if (base64Data.includes('zig1') || base64Data.includes('ZIG1')) {
          // This might be a raw transaction string with addresses
          const addressRegex = /(zig1[a-zA-Z0-9]{38,44})/g;
          const addresses = base64Data.match(addressRegex);
          
          if (addresses && addresses.length >= 2) {
            console.log("Found Cosmos addresses in raw string:", addresses);
            
            // Extract amount and denom if present
            const amountRegex = /([0-9]+)([a-zA-Z]+)/g;
            const amountMatch = amountRegex.exec(base64Data);
            
            return {
              type: "Send",
              sender: addresses[0],
              recipient: addresses[1],
              amount: amountMatch ? amountMatch[1] : undefined,
              denom: amountMatch ? amountMatch[2] : undefined,
              rawData: base64Data,
            };
          }
        }
        
        return { type: "Decode Error", rawData: base64Data };
      }
    }
  } catch (error) {
    console.error("Error in decodeTransaction:", error);
    return { type: "Error", rawData: base64Data || "" };
  }
}
