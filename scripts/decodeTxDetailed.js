// Detailed script to decode a Cosmos SDK transaction

const txHex = "0ad7030a9a010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125f0a2a7a69673132366b6e32336c7875726e73383377326e35396137653076327770726a64727266763478773812317a696776616c6f7065723173613572676b7271336339767879386d396c6838656835686e75646a6d6b676c6e68617a6a710a9a010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125f0a2a7a69673132366b6e32336c7875726e73383377326e35396137653076327770726a64727266763478773812317a696776616c6f7065723168687161657039337570346372756b3677763976387071763667683439646a6c7068363478680a9a010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125f0a2a7a69673132366b6e32336c7875726e73383377326e35396137653076327770726a64727266763478773812317a696776616c6f70657231656d6b6d61686878356a766b766b6a6734766d6a6d79366d66367576616673396866746e653912660a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2103a95be000eff17655c3f4fec2a2d9ce86e78f4be401aadca49ae36fbcb9cef4d012040a020801180312120a0c0a04757a696712043333373010a3c8141a40a2228007b4d9f3c91a71ff1c5fb9ab9ff316ede4a4d8afde86326f5bd75e0f43562a1cff827dddeb102c2f344f9e9f0737c67ed0bceb7377999bf1cb1675cccb";

// Function to extract readable information from the transaction
function decodeCosmosTransaction(txHex) {
  // Check if it's a Cosmos SDK transaction
  if (!txHex.includes('636f736d6f73')) { // 'cosmos' in hex
    console.log('This does not appear to be a Cosmos SDK transaction');
    return;
  }
  
  console.log('=== COSMOS SDK TRANSACTION DECODER ===\n');
  
  // Extract message types
  const msgTypes = extractMessageTypes(txHex);
  console.log('Message Types:');
  msgTypes.forEach((type, index) => {
    console.log(`  Message ${index + 1}: ${type}`);
  });
  console.log('');
  
  // Extract addresses
  const addresses = extractAddresses(txHex);
  console.log('Addresses Found:');
  addresses.forEach((address, index) => {
    console.log(`  Address ${index + 1}: ${address}`);
  });
  console.log('');
  
  // Extract denominations
  const denoms = extractDenominations(txHex);
  if (denoms.length > 0) {
    console.log('Token Denominations:');
    denoms.forEach((denom, index) => {
      console.log(`  Denom ${index + 1}: ${denom}`);
    });
    console.log('');
  }
  
  // Extract transaction details based on message type
  if (msgTypes.includes('MsgWithdrawDelegatorReward')) {
    decodeWithdrawRewardTx(txHex, addresses);
  } else if (msgTypes.includes('MsgDelegate')) {
    decodeDelegateTx(txHex, addresses);
  } else if (msgTypes.includes('MsgSend')) {
    decodeSendTx(txHex, addresses);
  }
  
  // Extract signature information
  if (txHex.includes('736563703235366b31')) { // 'secp256k1' in hex
    console.log('Signature Information:');
    console.log('  Algorithm: secp256k1');
    
    // Try to extract public key
    const pubKeyPattern = /5075624b657912[0-9a-f]+/;
    const pubKeyMatch = txHex.match(pubKeyPattern);
    if (pubKeyMatch) {
      console.log('  Public Key Info Found');
    }
    console.log('');
  }
}

// Extract message types from transaction
function extractMessageTypes(txHex) {
  const types = [];
  
  // Common message type patterns
  const patterns = [
    { pattern: /576974686472617744656c656761746f72526577617264/g, name: 'MsgWithdrawDelegatorReward' },
    { pattern: /44656c6567617465/g, name: 'MsgDelegate' },
    { pattern: /556e64656c6567617465/g, name: 'MsgUndelegate' },
    { pattern: /53656e64/g, name: 'MsgSend' },
    { pattern: /566f7465/g, name: 'MsgVote' }
  ];
  
  patterns.forEach(p => {
    if (txHex.match(p.pattern)) {
      types.push(p.name);
    }
  });
  
  return types;
}

// Extract addresses from transaction
function extractAddresses(txHex) {
  // Look for specific patterns in the transaction data
  // For delegator addresses (zig prefix)
  const delegatorPattern = /7a69673132[0-9a-f]{39}/g;
  const delegatorMatches = txHex.match(delegatorPattern) || [];
  
  // For validator addresses (zigvaloper prefix)
  const validatorPattern = /7a696776616c6f7065723[0-9a-f]{39}/g;
  const validatorMatches = txHex.match(validatorPattern) || [];
  
  // Combine all addresses
  return [...new Set([...delegatorMatches, ...validatorMatches])];
}

// Extract token denominations
function extractDenominations(txHex) {
  const denoms = [];
  
  // Common denominations in Cosmos chains
  const denomPatterns = [
    { pattern: /757a6967/g, name: 'uzig' },
    { pattern: /7561746f6d/g, name: 'uatom' },
    { pattern: /756f736d6f/g, name: 'uosmo' }
  ];
  
  denomPatterns.forEach(d => {
    if (txHex.match(d.pattern)) {
      denoms.push(d.name);
    }
  });
  
  return denoms;
}

// Decode Withdraw Reward transaction
function decodeWithdrawRewardTx(txHex, addresses) {
  console.log('=== WITHDRAW DELEGATOR REWARD TRANSACTION ===');
  
  // Filter addresses by type
  const delegatorAddresses = addresses.filter(addr => addr.startsWith('7a69673132'));
  const validatorAddresses = addresses.filter(addr => addr.startsWith('7a696776616c6f7065723'));
  
  if (delegatorAddresses.length > 0) {
    console.log('  Delegator: ' + delegatorAddresses[0]);
  }
  
  if (validatorAddresses.length > 0) {
    console.log('  Validators:');
    validatorAddresses.forEach((validator, index) => {
      console.log(`    Validator ${index + 1}: ${validator}`);
    });
  }
  
  console.log('');
}

// Decode Delegate transaction
function decodeDelegateTx(txHex, addresses) {
  console.log('=== DELEGATE TRANSACTION ===');
  
  // Filter addresses by type
  const delegatorAddresses = addresses.filter(addr => addr.startsWith('7a69673132'));
  const validatorAddresses = addresses.filter(addr => addr.startsWith('7a696776616c6f7065723'));
  
  if (delegatorAddresses.length > 0) {
    console.log('  Delegator: ' + delegatorAddresses[0]);
  }
  
  if (validatorAddresses.length > 0) {
    console.log('  Validator: ' + validatorAddresses[0]);
  }
  
  // Try to extract amount
  const amountPattern = /[0-9]+(?=757a6967)/;
  const amountMatch = txHex.match(amountPattern);
  if (amountMatch) {
    console.log('  Amount: ' + amountMatch[0] + ' uzig');
  }
  console.log('');
}

// Decode Send transaction
function decodeSendTx(txHex, addresses) {
  console.log('=== SEND TRANSACTION ===');
  
  // In a send transaction, typically we have two addresses of the same type
  const zigAddresses = addresses.filter(addr => addr.startsWith('7a69673132'));
  
  if (zigAddresses.length >= 2) {
    console.log('  From: ' + zigAddresses[0]);
    console.log('  To: ' + zigAddresses[1]);
  }
  
  // Try to extract amount
  const amountPattern = /[0-9]+(?=757a6967)/;
  const amountMatch = txHex.match(amountPattern);
  if (amountMatch) {
    console.log('  Amount: ' + amountMatch[0] + ' uzig');
  }
  console.log('');
}

// Execute the decoder
decodeCosmosTransaction(txHex);
