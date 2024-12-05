import { providers, Contract, Wallet, BigNumber, utils } from 'ethers';
import { logger } from '../logger';
import { config } from '../../config';
import { IPaymasterService, UserOperation } from '../../types/paymaster';

export class BasePaymasterService implements IPaymasterService {
    protected provider: providers.JsonRpcProvider;
    protected paymasterContract: Contract;

    constructor() {
        this.provider = new providers.JsonRpcProvider(config.blockchain.rpcUrl);
        this.paymasterContract = new Contract(
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

    async sponsorTransaction(tx: providers.TransactionRequest): Promise<providers.TransactionResponse> {
        try {
            logger.info('Sponsoring transaction with Base Paymaster', {
                from: tx.from,
                to: tx.to,
                value: tx.value?.toString()
            });

            const gasLimit = await this.estimateGas(tx);
            const paymasterData = await this.getPaymasterData({
                sender: tx.from!,
                nonce: '0x' + (await this.getNonce()).toString(16),
                initCode: '0x',
                callData: tx.data ? utils.hexlify(tx.data) : '0x',
                callGasLimit: '0x' + gasLimit.toString(),
                verificationGasLimit: '0x0',
                preVerificationGas: '0x0',
                maxFeePerGas: '0x0',
                maxPriorityFeePerGas: '0x0',
                signature: '0x'
            });

            const sponsoredTx = {
                ...tx,
                maxFeePerGas: BigNumber.from(0),
                maxPriorityFeePerGas: BigNumber.from(0),
                gasLimit,
                paymasterAndData: paymasterData
            };

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

    async estimateGas(tx: providers.TransactionRequest): Promise<BigNumber> {
        try {
            const estimate = await this.provider.estimateGas(tx);
            // Add 20% buffer for paymaster operations
            return estimate.mul(120).div(100);
        } catch (error) {
            logger.error('Failed to estimate gas:', { error });
            throw new Error('Failed to estimate gas');
        }
    }

    async getPaymasterData(operation: UserOperation): Promise<string> {
        try {
            const data = await this.paymasterContract.getPaymasterAndData(operation);
            return utils.hexlify(data);
        } catch (error) {
            logger.error('Failed to get paymaster data:', { error });
            throw new Error('Failed to get paymaster data');
        }
    }

    protected async getNonce(): Promise<number> {
        try {
            const nonce = await this.paymasterContract.getNonce();
            return nonce.toNumber();
        } catch (error) {
            logger.error('Failed to get nonce:', { error });
            throw new Error('Failed to get nonce');
        }
    }

    protected async signTransaction(tx: providers.TransactionRequest): Promise<string> {
        try {
            const wallet = new Wallet(config.coinbase.privateKey, this.provider);
            return await wallet.signTransaction(tx);
        } catch (error) {
            logger.error('Failed to sign transaction:', { error });
            throw new Error('Failed to sign transaction');
        }
    }
}