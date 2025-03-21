# Environment Variables

This document describes the environment variables used in the ZigChain Explorer project.

## Required Variables

- `RPC_URL`: The URL of the RPC endpoint for the ZigChain blockchain.
  - Default: `http://localhost:26657`
  - Example: `RPC_URL=http://localhost:26657`

## How to Set Up

1. Create a `.env` file in the root directory of the project.
2. Add the environment variables to the file in the format `KEY=VALUE`.
3. Restart the development server if it's already running.

Example `.env` file:
```
RPC_URL=http://localhost:26657
```

## Usage in Code

The environment variables are accessed in the code using `process.env.VARIABLE_NAME`. For example:

```typescript
const RPC_URL = process.env.RPC_URL || 'http://localhost:26657';
```

This pattern ensures that if the environment variable is not set, a default value is used.
