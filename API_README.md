# ZigChain API Documentation

## Overview

The ZigChain API provides a centralized, secure method for fetching blockchain information from the ZigChain network. This API serves as a middleware between the ZigChain Explorer frontend and the blockchain node, offering improved performance through caching, reduced direct load on the blockchain node, and consistent data formatting.

## Base URL

```
https://zigscan.net/api
```

For local development, the API is available at:

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication for read operations.

## Response Format

All API responses are returned in JSON format. Successful responses will have a 200 HTTP status code.

Error responses will include an appropriate HTTP status code and an error message in the response body.

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK`: The request was successful
- `400 Bad Request`: The request was invalid or cannot be served
- `404 Not Found`: The requested resource does not exist
- `500 Internal Server Error`: An error occurred on the server

## Rate Limiting

To ensure service stability, rate limiting may be implemented. Please keep request rates reasonable.

## Endpoints

### Chain Information

#### Get Chain Info

```
GET /chain/info
```

Returns basic information about the blockchain.

**Response:**

```json
{
  "chain_id": "zigchain",
  "latest_block_height": "1234567",
  "latest_block_time": "2023-01-01T12:00:00Z",
  "validator_count": 100,
  "bonded_tokens": "1000000000",
  "node_info": {
    "version": "1.0.0"
  }
}
```

### Blocks

#### Get Latest Blocks

```
GET /blocks?limit={limit}
```

Returns the latest blocks from the blockchain.

**Parameters:**

- `limit` (optional): Number of blocks to return (default: 10, max: 100)

**Response:**

```json
[
  {
    "height": 1234567,
    "time": "2023-01-01T12:00:00Z",
    "proposer": "zig1abc...",
    "txCount": 5,
    "hash": "ABCDEF...",
    "transactions": ["tx1hash", "tx2hash", ...]
  },
  ...
]
```

#### Get Block by Height

```
GET /blocks/{height}
```

Returns detailed information about a specific block.

**Parameters:**

- `height`: Block height (required)

**Response:**

```json
{
  "height": 1234567,
  "time": "2023-01-01T12:00:00Z",
  "proposer": "zig1abc...",
  "txCount": 5,
  "hash": "ABCDEF...",
  "transactions": ["tx1hash", "tx2hash", ...],
  "appHash": "ABCDEF...",
  "consensusHash": "ABCDEF...",
  "lastCommitHash": "ABCDEF...",
  "validatorHash": "ABCDEF...",
  "evidenceHash": "ABCDEF...",
  "lastResultsHash": "ABCDEF..."
}
```

### Transactions

#### Get Latest Transactions

```
GET /transactions?limit={limit}
```

Returns the latest transactions from the blockchain.

**Parameters:**

- `limit` (optional): Number of transactions to return (default: 10, max: 100)

**Response:**

```json
[
  {
    "hash": "ABCDEF...",
    "height": 1234567,
    "time": "2023-01-01T12:00:00Z",
    "from": "zig1abc...",
    "to": "zig1def...",
    "amount": "1000",
    "fee": "0.1",
    "status": "success"
  },
  ...
]
```

#### Get Transaction by Hash

```
GET /transactions/{hash}
```

Returns detailed information about a specific transaction.

**Parameters:**

- `hash`: Transaction hash (required)

**Response:**

```json
{
  "hash": "ABCDEF...",
  "height": 1234567,
  "time": "2023-01-01T12:00:00Z",
  "from": "zig1abc...",
  "to": "zig1def...",
  "amount": "1000",
  "fee": "0.1",
  "status": "success",
  "tx_result": {
    "code": 0,
    "data": "...",
    "log": "...",
    "gas_wanted": "100000",
    "gas_used": "50000",
    "events": [...]
  }
}
```

### Accounts

#### Get Account Information

```
GET /accounts/{address}
```

Returns information about a specific account.

**Parameters:**

- `address`: Account address (required)

**Response:**

```json
{
  "address": "zig1abc...",
  "balance": "1000000",
  "sequence": 10,
  "account_number": 5,
  "public_key": "..."
}
```

#### Get Account Transactions

```
GET /accounts/{address}/transactions?page={page}&limit={limit}
```

Returns transactions related to a specific account.

**Parameters:**

- `address`: Account address (required)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of transactions per page (default: 10, max: 100)

**Response:**

```json
{
  "transactions": [
    {
      "hash": "ABCDEF...",
      "height": 1234567,
      "time": "2023-01-01T12:00:00Z",
      "from": "zig1abc...",
      "to": "zig1def...",
      "amount": "1000",
      "fee": "0.1",
      "status": "success"
    },
    ...
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Validators

#### Get Validators

```
GET /validators
```

Returns a list of all validators.

**Response:**

```json
[
  {
    "operator_address": "zigvaloper1abc...",
    "status": "BOND_STATUS_BONDED",
    "tokens": "1000000",
    "delegator_shares": "1000000",
    "description": {
      "moniker": "Validator Name",
      "identity": "...",
      "website": "https://example.com",
      "security_contact": "security@example.com",
      "details": "Validator details"
    },
    "commission": {
      "commission_rates": {
        "rate": "0.1",
        "max_rate": "0.2",
        "max_change_rate": "0.01"
      },
      "update_time": "2023-01-01T12:00:00Z"
    }
  },
  ...
]
```

#### Get Validator by Address

```
GET /validators/{address}
```

Returns detailed information about a specific validator.

**Parameters:**

- `address`: Validator operator address (required)

**Response:**

```json
{
  "operator_address": "zigvaloper1abc...",
  "address": "zig1abc...",
  "consensus_pubkey": {
    "@type": "/cosmos.crypto.ed25519.PubKey",
    "key": "..."
  },
  "jailed": false,
  "status": "BOND_STATUS_BONDED",
  "tokens": "1000000",
  "delegator_shares": "1000000",
  "votingPower": 1000,
  "description": {
    "moniker": "Validator Name",
    "identity": "...",
    "website": "https://example.com",
    "security_contact": "security@example.com",
    "details": "Validator details"
  },
  "unbonding_height": "0",
  "unbonding_time": "",
  "commission": {
    "commissionRates": {
      "rate": "0.1"
    },
    "commission_rates": {
      "rate": "0.1",
      "max_rate": "0.2",
      "max_change_rate": "0.01"
    },
    "update_time": "2023-01-01T12:00:00Z"
  },
  "min_self_delegation": "1"
}
```

## Fallback Mechanism

The ZigChain API includes a fallback mechanism that automatically switches to direct RPC calls if the API server is unavailable. This ensures high availability and reliability of the ZigChain Explorer.

## Caching

The API implements caching strategies to improve performance and reduce load on the blockchain node. Cached data is regularly updated to ensure freshness.

## WebSocket Support

For real-time updates, the API provides WebSocket support at:

```
wss://zigscan.net/websocket
```

## Development and Integration

For integrating with the ZigChain API in your application, we recommend using the provided `apiClient.ts` module which handles API availability checking, fallback mechanisms, and error handling.

## Support

For any issues or questions regarding the API, please contact the ZigChain team or open an issue in the GitHub repository.

---

© 2025 ZigChain Network. All rights reserved.
