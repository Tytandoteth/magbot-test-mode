import { providers, BigNumber, utils } from 'ethers';
import { logger } from '../logger';
import { BasePaymasterService } from './base';
import { UserOperation, PaymasterResponse } from '../../types/paymaster';
import { config } from '../../config';

export class CoinbasePaymasterService extends BasePaymasterService {
    private readonly apiBaseUrl: string;

    constructor() {
        super();
        this.apiBaseUrl = 'https://api.coinbase.com/v1/paymaster';
    }

    async sponsorTransaction(tx: providers.TransactionRequest): Promise<providers.TransactionResponse> {
        try {
            logger.info('Sponsoring transaction with Coinbase Paymaster', {
                from: tx.from,
                to: tx.to,
                value: tx.value?.toString()
            });

            // Get Coinbase-specific paymaster data
            const paymasterData = await this.getCoinbasePaymasterData(tx);
            
            const sponsoredTx = {
                ...tx,
                maxFeePerGas: BigNumber.from(0),
                maxPriorityFeePerGas: BigNumber.from(0),
                gasLimit: await this.estimateGas(tx),
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

    private async getCoinbasePaymasterData(tx: providers.TransactionRequest): Promise<string> {
        try {
            const operation: UserOperation = {
                sender: tx.from!,
                nonce: '0x' + (await this.getNonce()).toString(16),
                initCode: '0x',
                callData: tx.data ? utils.hexlify(tx.data) : '0x',
                callGasLimit: '0x' + (await this.estimateGas(tx)).toString(),
                verificationGasLimit: '0x0',
                preVerificationGas: '0x0',
                maxFeePerGas: '0x0',
                maxPriorityFeePerGas: '0x0',
                signature: '0x'
            };

            const response = await fetch(`${this.apiBaseUrl}/paymaster-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.coinbase.apiKey}`
                },
                body: JSON.stringify({
                    operation,
                    entryPoint: config.blockchain.contracts.paymaster
                })
            });

            if (!response.ok) {
                throw new Error(`Coinbase API error: ${response.statusText}`);
            }

            const data = await response.json() as PaymasterResponse;
            return utils.hexlify(data.paymasterAndData || '0x');
        } catch (error) {
            logger.error('Failed to get Coinbase paymaster data:', { error });
            throw new Error('Failed to get Coinbase paymaster data');
        }
    }
}