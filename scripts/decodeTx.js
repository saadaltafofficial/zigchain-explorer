// Simple script to decode a transaction

const txHex = "0ad7030a9a010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125f0a2a7a69673132366b6e32336c7875726e73383377326e35396137653076327770726a64727266763478773812317a696776616c6f7065723173613572676b7271336339767879386d396c6838656835686e75646a6d6b676c6e68617a6a710a9a010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125f0a2a7a69673132366b6e32336c7875726e73383377326e35396137653076327770726a64727266763478773812317a696776616c6f7065723168687161657039337570346372756b3677763976387071763667683439646a6c7068363478680a9a010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125f0a2a7a69673132366b6e32336c7875726e73383377326e35396137653076327770726a64727266763478773812317a696776616c6f70657231656d6b6d61686878356a766b766b6a6734766d6a6d79366d66367576616673396866746e653912660a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2103a95be000eff17655c3f4fec2a2d9ce86e78f4be401aadca49ae36fbcb9cef4d012040a020801180312120a0c0a04757a696712043333373010a3c8141a40a2228007b4d9f3c91a71ff1c5fb9ab9ff316ede4a4d8afde86326f5bd75e0f43562a1cff827dddeb102c2f344f9e9f0737c67ed0bceb7377999bf1cb1675cccb";

// Function to extract readable information from the transaction
function decodeTransaction(txHex) {
  // Check if it's a Cosmos SDK transaction
  if (txHex.includes('636f736d6f73')) { // 'cosmos' in hex
    console.log('This appears to be a Cosmos SDK transaction');
    
    // Try to identify the message type
    if (txHex.includes('576974686472617744656c656761746f7252657761726')) {
      console.log('Transaction type: Withdraw Delegator Reward');
    } else if (txHex.includes('44656c6567617465')) {
      console.log('Transaction type: Delegate');
    } else if (txHex.includes('53656e64')) {
      console.log('Transaction type: Send');
    } else {
      console.log('Unknown Cosmos transaction type');
    }
    
    // Extract addresses
    const addressPattern = /7a69673[0-9a-f]{39}/g;
    const addresses = txHex.match(addressPattern);
    
    if (addresses && addresses.length > 0) {
      console.log('\nAddresses found in transaction:');
      addresses.forEach((address, index) => {
        console.log(`Address ${index + 1}: ${address}`);
      });
    }
    
    // Look for other common fields
    if (txHex.includes('757a696712')) {
      console.log('\nToken denomination: uzig');
    }
  } else {
    console.log('This does not appear to be a Cosmos SDK transaction');
  }
}

console.log('Decoding transaction...\n');
decodeTransaction(txHex);
console.log('\nRaw transaction hex:');
console.log(txHex);
