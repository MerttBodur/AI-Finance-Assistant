import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "Auto-Invest AI Vault",
  projectId: walletConnectProjectId,
  chains: [baseSepolia],
});
