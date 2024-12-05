import { ethers } from 'ethers';
import { logger } from '../logger';
import { config } from '../../config';

export class PaymasterService {
  private provider: ethers.providers.JsonRpcProvider;
  private paymasterContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.paymasterContract = new ethers.Contract(
      config.blockchain.contracts.paymaster,
      [
        'function depositFor(address account) external payable',
        'function getDeposit(address account) external view returns (uint256)',
        'function withdrawTo(address payable withdrawAddress, uint256 amount) external',
        'function getNonce() external view returns (uint256)'
      ],
      this.provider
    );
  }

  async sponsorTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
    try {
      logger.info('Sponsoring transaction with Coinbase Paymaster', {
        from: tx.from,
        to: tx.to,
        value: tx.value?.toString()
      });

      // Add paymaster data to transaction
      const sponsoredTx = {
        ...tx,
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
        gasLimit: await this.estimateGas(tx),
        paymasterData: {
          sponsor: config.blockchain.contracts.paymaster,
          sponsorNonce: await this.getNextNonce()
        }
      };

      // Sign and send transaction
      const response = await this.provider.sendTransaction(
        await this.signTransaction(sponsoredTx)
      );

      logger.info('Transaction sponsored successfully', {
        txHash: response.hash,
        from: tx.from,
        to: tx.to
      });

      return response;
    } catch (error) {
      logger.error('Failed to sponsor transaction:', { error });
      throw new Error('Failed to sponsor transaction');
    }
  }

  private async estimateGas(tx: ethers.providers.TransactionRequest): Promise<ethers.BigNumber> {
    try {
      const estimate = await this.provider.estimateGas(tx);
      // Add 20% buffer for paymaster operations
      return estimate.mul(120).div(100);
    } catch (error) {
      logger.error('Failed to estimate gas:', { error });
      throw new Error('Failed to estimate gas');
    }
  }

  private async getNextNonce(): Promise<number> {
    try {
      const nonce = await this.paymasterContract.getNonce();
      return nonce.toNumber();
    } catch (error) {
      logger.error('Failed to get paymaster nonce:', { error });
      throw new Error('Failed to get paymaster nonce');
    }
  }

  private async signTransaction(tx: ethers.providers.TransactionRequest): Promise<string> {
    try {
      const wallet = new ethers.Wallet(config.coinbase.privateKey, this.provider);
      return await wallet.signTransaction(tx);
    } catch (error) {
      logger.error('Failed to sign transaction:', { error });
      throw new Error('Failed to sign transaction');
    }
  }
}