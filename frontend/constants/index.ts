export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;
export const MOCK_AAVE_ADDRESS = (process.env.NEXT_PUBLIC_MOCK_AAVE_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;
export const CHAIN_ID = 84532;
