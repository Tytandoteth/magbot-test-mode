import { providers } from 'ethers';

export interface TelegramConfig {
  botToken: string;
  rateLimitWindow: number;
  maxRequestsPerWindow: number;
}

export interface ServerConfig {
  port: number;
  memoryThreshold: number;
  healthCheck: {
    interval: number;
    timeout: number;
  };
}

export interface LoggingConfig {
  level: string;
  format: string;
  filePath: string;
  enableDebug: boolean;
}

export interface MongoDBConfig {
  uri: string;
}

export interface BlockchainConfig {
  provider: providers.JsonRpcProvider;
  chainId: number;
  rpcUrl: string;
  contracts: {
    identity: string;
    paymaster: string;
    lending: string;
  };
}

export interface AlchemyConfig {
  apiKey: string;
  network: string;
}

export interface CoinbaseConfig {
  apiKey: string;
  privateKey: string;
  appName: string;
  appLogoUrl: string;
}

export interface ThirdwebConfig {
  clientId: string;
  secretKey: string;
  network: string;
}

export interface AppConfig {
  telegram: TelegramConfig;
  server: ServerConfig;
  logging: LoggingConfig;
  mongodb: MongoDBConfig;
  blockchain: BlockchainConfig;
  alchemy: AlchemyConfig;
  coinbase: CoinbaseConfig;
  thirdweb: ThirdwebConfig;
}