import { BasePipeline } from './base-pipeline';
import { SolanaPipeline } from './solana-pipeline';
import { NearPipeline } from './near-pipeline';
import { NetworkType, AuditRequest } from '../types/audit.types';
import { getNetworkConfig } from '../utils/network-config';

export class PipelineFactory {
  static createPipeline(networkType: NetworkType, jobId: string): BasePipeline {
    // Map network to primary language
    const primaryLanguage = this.getNetworkLanguage(networkType);
    const networkConfig = getNetworkConfig(networkType, primaryLanguage);
    
    if (!networkConfig) {
      throw new Error(`Network configuration not found for: ${networkType} (${primaryLanguage})`);
    }
    
    switch (networkType) {
      case 'solana':
        return new SolanaPipeline(networkConfig, jobId);
      
      case 'near':
        return new NearPipeline(networkConfig, jobId);
      
      case 'aptos':
        // TODO: Implement AptosPipeline
        throw new Error('Aptos pipeline not yet implemented');
      
      case 'sui':
        // TODO: Implement SuiPipeline
        throw new Error('Sui pipeline not yet implemented');
      
      case 'ethereum':
        // TODO: Implement EthereumPipeline
        throw new Error('Ethereum pipeline not yet implemented');
      
      case 'starknet':
        // TODO: Implement StarkNetPipeline
        throw new Error('StarkNet pipeline not yet implemented');
      
      default:
        throw new Error(`Unsupported network type: ${networkType}`);
    }
  }

  private static getNetworkLanguage(networkType: NetworkType): 'rust' | 'move' | 'solidity' | 'cairo' {
    const languageMap: Record<NetworkType, 'rust' | 'move' | 'solidity' | 'cairo'> = {
      solana: 'rust',
      near: 'rust',
      aptos: 'move',
      sui: 'move',
      ethereum: 'solidity',
      starknet: 'cairo'
    };

    return languageMap[networkType];
  }

  static getSupportedNetworks(): NetworkType[] {
    return ['solana', 'near', 'aptos', 'sui', 'ethereum', 'starknet'];
  }

  static isNetworkSupported(networkType: string): networkType is NetworkType {
    return this.getSupportedNetworks().includes(networkType as NetworkType);
  }

  static getNetworkCapabilities(networkType: NetworkType): {
    implemented: boolean;
    language: string;
    features: string[];
  } {
    const capabilities = {
      solana: {
        implemented: true,
        language: 'Rust',
        features: ['CPI Analysis', 'PDA Security', 'Anchor Support', 'Token Program']
      },
      near: {
        implemented: true,
        language: 'Rust',
        features: ['Cross-contract Calls', 'Callbacks', 'Storage Management', 'Gas Optimization']
      },
      aptos: {
        implemented: false,
        language: 'Move',
        features: ['Resource Safety', 'Move Prover', 'Formal Verification', 'Module System']
      },
      sui: {
        implemented: false,
        language: 'Move',
        features: ['Object Model', 'Parallel Execution', 'Move Bytecode', 'Ownership System']
      },
      ethereum: {
        implemented: false,
        language: 'Solidity',
        features: ['EVM Analysis', 'Gas Optimization', 'Reentrancy Detection', 'Proxy Patterns']
      },
      starknet: {
        implemented: false,
        language: 'Cairo',
        features: ['STARK Proofs', 'Account Abstraction', 'L2 Security', 'Cairo VM']
      }
    };

    return capabilities[networkType];
  }
}
