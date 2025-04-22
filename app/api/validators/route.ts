import { NextResponse } from 'next/server';
import axios from 'axios';

// RPC endpoint for direct access
const RPC_URL = process.env.RPC_URL || 'https://zigscan.net';

/**
 * GET handler for /api/validators
 * This proxy API route solves CORS/mixed content issues when deployed to Vercel
 */
export async function GET() {
  try {
    console.log('[API Route] Fetching validators from RPC endpoint');
    
    // Get basic validator information
    const validatorsResponse = await axios.get(`${RPC_URL}/validators`);
    
    // Get status information which might contain validator names
    const statusResponse = await axios.get(`${RPC_URL}/status`);
    
    let validators = [];
    let nodeInfo = null;
    
    // Extract validators from response
    if (validatorsResponse.data && validatorsResponse.data.result && validatorsResponse.data.result.validators) {
      validators = validatorsResponse.data.result.validators;
    } else if (Array.isArray(validatorsResponse.data)) {
      validators = validatorsResponse.data;
    }
    
    // Extract node info from status response
    if (statusResponse.data && statusResponse.data.result && statusResponse.data.result.node_info) {
      nodeInfo = statusResponse.data.result.node_info;
    }
    
    // Process validators to add names and additional information
    const enhancedValidators = validators.map((validator: any, index: number) => {
      // Generate a base moniker based on index and address
      let moniker = `Validator ${index + 1}`;
      
      // If we have node info and this is the first validator, use the node name
      if (nodeInfo && nodeInfo.moniker && index === 0) {
        moniker = nodeInfo.moniker;
      } else if (validator.address && validator.address.length > 8) {
        // Otherwise use a portion of the address
        moniker = `Validator ${validator.address.substring(0, 8)}`;
      }
      
      // Extract pub key if available
      let pubKeyValue = '';
      if (validator.pub_key && validator.pub_key.value) {
        pubKeyValue = validator.pub_key.value;
      } else if (validator.pub_key) {
        pubKeyValue = JSON.stringify(validator.pub_key);
      }
      
      // Parse voting power
      let votingPower = 0;
      try {
        votingPower = parseInt(validator.voting_power || '0');
        if (isNaN(votingPower)) votingPower = 0;
      } catch (err) {
        console.warn('[API Route] Error parsing voting power:', err);
      }
      
      // Return enhanced validator object
      return {
        operator_address: validator.address,
        address: validator.address,
        consensus_pubkey: {
          '@type': '/cosmos.crypto.ed25519.PubKey',
          key: pubKeyValue
        },
        jailed: false,
        status: votingPower > 0 ? 'BOND_STATUS_BONDED' : 'BOND_STATUS_UNBONDED',
        tokens: (votingPower * 1000000).toString(),
        delegator_shares: (votingPower * 1000000).toString(),
        voting_power: votingPower,
        description: {
          moniker: moniker,
          identity: '',
          website: '',
          security_contact: '',
          details: nodeInfo ? `Network: ${nodeInfo.network || 'ZigChain'}` : ''
        },
        unbonding_height: '0',
        unbonding_time: '',
        commission: {
          commission_rates: {
            rate: '0.05', // Default commission rate
            max_rate: '0.20',
            max_change_rate: '0.01'
          },
          update_time: new Date().toISOString()
        },
        min_self_delegation: '1'
      };
    });
    
    console.log(`[API Route] Processed ${enhancedValidators.length} validators`);
    
    // Return the enhanced validators
    return NextResponse.json(enhancedValidators);
  } catch (error) {
    console.error('[API Route] Error fetching validators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validators' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for /api/validators/[address]
 * This proxy API route handles fetching individual validator details
 */
export async function GET_validator(request: Request, { params }: { params: { address: string } }) {
  try {
    const { address } = params;
    console.log(`[API Route] Fetching validator with address: ${address}`);
    
    // Get all validators
    const validatorsResponse = await axios.get(`${RPC_URL}/validators`);
    
    // Get status information
    const statusResponse = await axios.get(`${RPC_URL}/status`);
    
    let validators = [];
    let nodeInfo = null;
    
    // Extract validators from response
    if (validatorsResponse.data && validatorsResponse.data.result && validatorsResponse.data.result.validators) {
      validators = validatorsResponse.data.result.validators;
    } else if (Array.isArray(validatorsResponse.data)) {
      validators = validatorsResponse.data;
    }
    
    // Extract node info from status response
    if (statusResponse.data && statusResponse.data.result && statusResponse.data.result.node_info) {
      nodeInfo = statusResponse.data.result.node_info;
    }
    
    // Find the specific validator
    const validator = validators.find((v: any) => v.address === address);
    
    if (!validator) {
      return NextResponse.json(
        { error: `Validator with address ${address} not found` },
        { status: 404 }
      );
    }
    
    // Generate moniker
    let moniker = `Validator ${address.substring(0, 8)}`;
    if (nodeInfo && nodeInfo.moniker && validators[0].address === address) {
      moniker = nodeInfo.moniker;
    }
    
    // Extract pub key
    let pubKeyValue = '';
    if (validator.pub_key && validator.pub_key.value) {
      pubKeyValue = validator.pub_key.value;
    } else if (validator.pub_key) {
      pubKeyValue = JSON.stringify(validator.pub_key);
    }
    
    // Parse voting power
    let votingPower = 0;
    try {
      votingPower = parseInt(validator.voting_power || '0');
      if (isNaN(votingPower)) votingPower = 0;
    } catch (err) {
      console.warn('[API Route] Error parsing voting power:', err);
    }
    
    // Return enhanced validator object
    const enhancedValidator = {
      operator_address: validator.address,
      address: validator.address,
      consensus_pubkey: {
        '@type': '/cosmos.crypto.ed25519.PubKey',
        key: pubKeyValue
      },
      jailed: false,
      status: votingPower > 0 ? 'BOND_STATUS_BONDED' : 'BOND_STATUS_UNBONDED',
      tokens: (votingPower * 1000000).toString(),
      delegator_shares: (votingPower * 1000000).toString(),
      voting_power: votingPower,
      description: {
        moniker: moniker,
        identity: '',
        website: '',
        security_contact: '',
        details: nodeInfo ? `Network: ${nodeInfo.network || 'ZigChain'}` : ''
      },
      unbonding_height: '0',
      unbonding_time: '',
      commission: {
        commission_rates: {
          rate: '0.05', // Default commission rate
          max_rate: '0.20',
          max_change_rate: '0.01'
        },
        update_time: new Date().toISOString()
      },
      min_self_delegation: '1'
    };
    
    return NextResponse.json(enhancedValidator);
  } catch (error) {
    console.error('[API Route] Error fetching validator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator details' },
      { status: 500 }
    );
  }
}
