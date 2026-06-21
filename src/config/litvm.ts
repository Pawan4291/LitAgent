// LitVM LiteForge Testnet Configuration
export const LITVM_CHAIN = {
  chainId: "0x1159", // 4441 in decimal
  chainIdDecimal: 4441,
  chainName: "LitVM LiteForge Testnet",
  rpcUrl: "https://liteforge.rpc.caldera.xyz/http",
  rpcWs: "wss://liteforge.rpc.caldera.xyz/ws",
  explorerUrl: "https://liteforge.explorer.caldera.xyz",
  faucetUrl: "https://liteforge.hub.caldera.xyz/",
  nativeCurrency: {
    name: "zkLTC",
    symbol: "zkLTC",
    decimals: 18,
  },
  // zkLTC is the native gas token on LitVM testnet
  // For ERC-20 wrapped version if exists - native token used for gas
  zkLTCAddress: "0x0000000000000000000000000000000000000000", // Native token
};

export const CHAIN_PARAMS = [
  {
    chainId: LITVM_CHAIN.chainId,
    chainName: LITVM_CHAIN.chainName,
    nativeCurrency: LITVM_CHAIN.nativeCurrency,
    rpcUrls: [LITVM_CHAIN.rpcUrl],
    blockExplorerUrls: [LITVM_CHAIN.explorerUrl],
  },
];
