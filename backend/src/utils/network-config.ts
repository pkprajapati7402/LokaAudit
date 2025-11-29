import { NetworkType, LanguageType } from '../types/audit.types';

export interface NetworkConfig {
  network: NetworkType;
  language: LanguageType;
  displayName: string;
  description: string;
  parser: string;
  staticAnalyzers: string[];
  semanticAnalyzers: string[];
  externalTools: string[];
  fileExtensions: string[];
  configFiles: string[];
  features: NetworkFeatures;
  vulnerabilityRules: string[];
}

export interface NetworkFeatures {
  supportsMultisig: boolean;
  hasNativeToken: boolean;
  supportsCrossProgramInvocation: boolean;
  hasBuiltinSecurity: boolean;
  supportsUpgradability: boolean;
  hasStateRent: boolean;
  supportsFormalVerification: boolean;
}

// Network-specific configurations
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // Solana (Rust)
  'solana-rust': {
    network: 'solana',
    language: 'rust',
    displayName: 'Solana (Rust)',
    description: 'Solana blockchain smart contracts written in Rust using Anchor framework',
    parser: 'rust-parser',
    staticAnalyzers: ['rust-static-analyzer', 'anchor-analyzer'],
    semanticAnalyzers: ['solana-semantic-analyzer', 'anchor-semantic-analyzer'],
    externalTools: ['clippy', 'cargo-audit', 'solana-security-txt'],
    fileExtensions: ['.rs'],
    configFiles: ['Cargo.toml', 'Anchor.toml', 'programs/*/Cargo.toml'],
    features: {
      supportsMultisig: true,
      hasNativeToken: true,
      supportsCrossProgramInvocation: true,
      hasBuiltinSecurity: false,
      supportsUpgradability: true,
      hasStateRent: true,
      supportsFormalVerification: false
    },
    vulnerabilityRules: [
      'solana-integer-overflow',
      'solana-signer-authorization',
      'solana-account-data-matching',
      'solana-owner-checks',
      'solana-rent-exemption',
      'solana-pda-derivation',
      'solana-cpi-vulnerabilities',
      'anchor-account-constraints',
      'anchor-signer-seeds',
      'anchor-space-constraints'
    ]
  },

  // Near (Rust)
  'near-rust': {
    network: 'near',
    language: 'rust',
    displayName: 'Near Protocol (Rust)',
    description: 'Near Protocol smart contracts written in Rust',
    parser: 'rust-parser',
    staticAnalyzers: ['rust-static-analyzer', 'near-analyzer'],
    semanticAnalyzers: ['near-semantic-analyzer'],
    externalTools: ['clippy', 'cargo-audit', 'near-workspaces'],
    fileExtensions: ['.rs'],
    configFiles: ['Cargo.toml', 'near-workspaces.toml'],
    features: {
      supportsMultisig: true,
      hasNativeToken: true,
      supportsCrossProgramInvocation: true,
      hasBuiltinSecurity: true,
      supportsUpgradability: true,
      hasStateRent: false,
      supportsFormalVerification: false
    },
    vulnerabilityRules: [
      'near-callback-security',
      'near-promise-handling',
      'near-storage-management',
      'near-gas-optimization',
      'near-access-control',
      'near-reentrancy',
      'near-panic-handling',
      'near-serialization'
    ]
  },

  // Aptos (Move)
  'aptos-move': {
    network: 'aptos',
    language: 'move',
    displayName: 'Aptos (Move)',
    description: 'Aptos blockchain smart contracts written in Move language',
    parser: 'move-parser',
    staticAnalyzers: ['move-static-analyzer', 'aptos-analyzer'],
    semanticAnalyzers: ['move-semantic-analyzer', 'aptos-semantic-analyzer'],
    externalTools: ['move-prover', 'aptos-cli'],
    fileExtensions: ['.move'],
    configFiles: ['Move.toml', 'sources/**/*.move'],
    features: {
      supportsMultisig: true,
      hasNativeToken: true,
      supportsCrossProgramInvocation: true,
      hasBuiltinSecurity: true,
      supportsUpgradability: true,
      hasStateRent: false,
      supportsFormalVerification: true
    },
    vulnerabilityRules: [
      'move-resource-safety',
      'move-capability-security',
      'move-reference-safety',
      'move-abort-conditions',
      'aptos-coin-handling',
      'aptos-object-model',
      'aptos-event-handling',
      'move-generic-safety'
    ]
  },

  // Sui (Move)
  'sui-move': {
    network: 'sui',
    language: 'move',
    displayName: 'Sui (Move)',
    description: 'Sui blockchain smart contracts written in Move language',
    parser: 'move-parser',
    staticAnalyzers: ['move-static-analyzer', 'sui-analyzer'],
    semanticAnalyzers: ['move-semantic-analyzer', 'sui-semantic-analyzer'],
    externalTools: ['move-prover', 'sui-cli'],
    fileExtensions: ['.move'],
    configFiles: ['Move.toml', 'sources/**/*.move'],
    features: {
      supportsMultisig: true,
      hasNativeToken: true,
      supportsCrossProgramInvocation: true,
      hasBuiltinSecurity: true,
      supportsUpgradability: true,
      hasStateRent: false,
      supportsFormalVerification: true
    },
    vulnerabilityRules: [
      'move-resource-safety',
      'move-capability-security',
      'move-reference-safety',
      'sui-object-ownership',
      'sui-dynamic-fields',
      'sui-transfer-policies',
      'sui-consensus-safety',
      'sui-parallel-execution'
    ]
  },

  // Ethereum (Solidity)
  'ethereum-solidity': {
    network: 'ethereum',
    language: 'solidity',
    displayName: 'Ethereum (Solidity)',
    description: 'Ethereum smart contracts written in Solidity',
    parser: 'solidity-parser',
    staticAnalyzers: ['solidity-static-analyzer', 'slither'],
    semanticAnalyzers: ['ethereum-semantic-analyzer'],
    externalTools: ['slither', 'mythril', 'echidna', 'manticore'],
    fileExtensions: ['.sol'],
    configFiles: ['hardhat.config.js', 'truffle-config.js', 'foundry.toml'],
    features: {
      supportsMultisig: true,
      hasNativeToken: true,
      supportsCrossProgramInvocation: true,
      hasBuiltinSecurity: false,
      supportsUpgradability: true,
      hasStateRent: false,
      supportsFormalVerification: true
    },
    vulnerabilityRules: [
      'solidity-reentrancy',
      'solidity-integer-overflow',
      'solidity-access-control',
      'solidity-unchecked-call',
      'solidity-tx-origin',
      'solidity-timestamp-dependence',
      'solidity-front-running',
      'solidity-gas-limit-dos'
    ]
  },

  // StarkNet (Cairo)
  'starknet-cairo': {
    network: 'starknet',
    language: 'cairo',
    displayName: 'StarkNet (Cairo)',
    description: 'StarkNet smart contracts written in Cairo',
    parser: 'cairo-parser',
    staticAnalyzers: ['cairo-static-analyzer'],
    semanticAnalyzers: ['starknet-semantic-analyzer'],
    externalTools: ['cairo-test', 'starknet-compile'],
    fileExtensions: ['.cairo'],
    configFiles: ['Scarb.toml', 'cairo_project.toml'],
    features: {
      supportsMultisig: true,
      hasNativeToken: true,
      supportsCrossProgramInvocation: true,
      hasBuiltinSecurity: true,
      supportsUpgradability: true,
      hasStateRent: false,
      supportsFormalVerification: true
    },
    vulnerabilityRules: [
      'cairo-felt-overflow',
      'cairo-array-bounds',
      'cairo-storage-security',
      'cairo-syscall-safety',
      'starknet-l1-l2-messaging',
      'cairo-recursion-depth',
      'cairo-memory-safety'
    ]
  }
};

// Network detection utilities
export function detectNetworkFromLanguage(language: string): NetworkType {
  const lowerLang = language.toLowerCase();
  
  if (lowerLang.includes('solana')) return 'solana';
  if (lowerLang.includes('near')) return 'near';
  if (lowerLang.includes('aptos')) return 'aptos';
  if (lowerLang.includes('sui')) return 'sui';
  if (lowerLang.includes('ethereum')) return 'ethereum';
  if (lowerLang.includes('starknet') || lowerLang.includes('cairo')) return 'starknet';
  
  // Default mappings
  if (lowerLang.includes('rust')) return 'solana'; // Default Rust to Solana
  if (lowerLang.includes('move')) return 'aptos'; // Default Move to Aptos
  if (lowerLang.includes('solidity')) return 'ethereum';
  if (lowerLang.includes('cairo')) return 'starknet';
  
  return 'solana'; // Default fallback
}

export function getNetworkConfig(network: NetworkType, language: LanguageType): NetworkConfig | null {
  const configKey = `${network}-${language}`;
  return NETWORK_CONFIGS[configKey] || null;
}

export function getSupportedNetworks(): string[] {
  return Object.keys(NETWORK_CONFIGS);
}

export function getNetworksByLanguage(language: LanguageType): NetworkConfig[] {
  return Object.values(NETWORK_CONFIGS).filter(config => config.language === language);
}

export function isNetworkSupported(network: NetworkType, language: LanguageType): boolean {
  const configKey = `${network}-${language}`;
  return configKey in NETWORK_CONFIGS;
}
