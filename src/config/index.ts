import dotenv from 'dotenv';
import { providers } from 'ethers';
import { AppConfig } from '../types/config';
import { logger } from '../logger';
import { loggerConfig } from '../logger/config';
import { telegramConfig } from './telegram';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

export const config: AppConfig = {
  telegram: telegramConfig,
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD || '90', 10),
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30', 10),
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5', 10)
    }
  },
  logging: loggerConfig,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/magnifycash'
  },
  blockchain: {
    provider: new providers.JsonRpcProvider(
      `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || 'demo'}`
    ),
    chainId: 8453,
    rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || 'demo'}`,
    contracts: {
      identity: process.env.IDENTITY_CONTRACT || '0x0000000000000000000000000000000000000000',
      paymaster: process.env.PAYMASTER_CONTRACT || '0x0000000000000000000000000000000000000000',
      lending: process.env.LENDING_CONTRACT || '0x0000000000000000000000000000000000000000'
    }
  },
  alchemy: {
    apiKey: process.env.ALCHEMY_API_KEY || 'demo',
    network: 'base-mainnet'
  },
  coinbase: {
    apiKey: process.env.COINBASE_API_KEY || '',
    privateKey: process.env.COINBASE_PRIVATE_KEY || '',
    appName: 'MagnifyCash Lending',
    appLogoUrl: 'https://magnifycash.com/logo.png'
  },
  thirdweb: {
    clientId: process.env.THIRDWEB_CLIENT_ID || '',
    secretKey: process.env.THIRDWEB_SECRET_KEY || '',
    network: 'base'
  }
};