import { providers, BigNumber } from 'ethers';

export interface UserOperation {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    signature: string;
    paymasterAndData?: string;
}

export interface PaymasterConfig {
    entryPoint: string;
    policyId: string;
    apiKey: string;
    baseUrl?: string;
}

export interface GasEstimation {
    preVerificationGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
}

export interface PaymasterResponse {
    userOpHash: string;
    success: boolean;
    error?: string;
    paymasterAndData?: string;
}

export interface IPaymasterService {
    sponsorTransaction(tx: providers.TransactionRequest): Promise<providers.TransactionResponse>;
    estimateGas(tx: providers.TransactionRequest): Promise<BigNumber>;
    getPaymasterData(operation: UserOperation): Promise<string>;
}