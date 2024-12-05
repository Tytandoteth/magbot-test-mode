import { ethers } from 'ethers';
import { logger } from '../../logger';
import { WalletCredentials, ICoinbaseWalletService } from '../../types';
import { config } from '../../config';
import { PaymasterService } from '../paymaster';

export class CoinbaseWalletService implements ICoinbaseWalletService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private paymaster: PaymasterService;
  private initialized: boolean = false;
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    this.paymaster = new PaymasterService();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('Initializing wallet service');

      // In development mode, use a local provider
      if (this.isDevelopment) {
        logger.info('Development mode: Using local provider');
        this.provider = new ethers.providers.JsonRpcProvider();
        this.initialized = true;
        return;
      }
      
      // Initialize provider with Base network
      this.provider = new ethers.providers.JsonRpcProvider(
        config.blockchain.rpcUrl,
        config.blockchain.chainId
      );

      // Test provider connection with timeout
      const networkPromise = this.provider.getNetwork();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network connection timeout')), 5000)
      );

      await Promise.race([networkPromise, timeoutPromise]);
      
      this.initialized = true;
      logger.info('Wallet service initialized successfully');
    } catch (error) {
      this.initialized = false;
      this.provider = null;
      logger.error('Failed to initialize wallet service:', { error });
      
      // Fallback to local provider in development
      if (this.isDevelopment) {
        logger.info('Falling back to local provider');
        this.provider = new ethers.providers.JsonRpcProvider();
        this.initialized = true;
        return;
      }
      
      throw new Error('Failed to initialize wallet service');
    }
  }

  async createWallet(): Promise<WalletCredentials> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // In development mode, create deterministic wallet
      if (this.isDevelopment) {
        const mockWallet = ethers.Wallet.createRandom();
        logger.info('Development mode: Created mock wallet', {
          address: mockWallet.address
        });
        return {
          address: mockWallet.address,
          privateKey: mockWallet.privateKey,
          mnemonic: mockWallet.mnemonic?.phrase || 'test test test test test test test test test test test junk'
        };
      }

      // Generate wallet with additional entropy
      const entropy = ethers.utils.randomBytes(32);
      const wallet = ethers.Wallet.fromMnemonic(
        ethers.utils.entropyToMnemonic(entropy)
      ).connect(this.provider);

      // Get mnemonic
      const mnemonic = wallet.mnemonic?.phrase;
      if (!mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }

      logger.info('Created new wallet', {
        address: wallet.address
      });

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic
      };
    } catch (error) {
      logger.error('Error creating wallet:', { error });
      throw new Error('Failed to create wallet');
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // In development mode, return mock balance
      if (this.isDevelopment) {
        logger.debug('Development mode: Using mock balance');
        return '0.0100';
      }

      logger.debug('Fetching wallet balance', { address });
      
      const balance = await this.provider.getBalance(address);
      const balanceInEth = parseFloat(ethers.utils.formatEther(balance)).toFixed(4);

      logger.debug('Retrieved wallet balance', {
        address,
        balance: balanceInEth
      });

      return balanceInEth;
    } catch (error) {
      logger.error('Error getting wallet balance:', { error });
      return '0.0000'; // Return zero balance on error
    }
  }

  async sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // In development mode, return mock transaction
      if (this.isDevelopment) {
        logger.info('Development mode: Simulating transaction');
        return {
          hash: '0x' + '1'.repeat(64),
          confirmations: 1,
          from: tx.from || '',
          wait: async () => ({ status: 1 })
        } as ethers.providers.TransactionResponse;
      }

      // Use paymaster to sponsor transaction
      return await this.paymaster.sponsorTransaction(tx);
    } catch (error) {
      logger.error('Failed to send transaction:', { error });
      throw new Error('Failed to send transaction');
    }
  }
}