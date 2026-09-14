import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { CHAIN } from "../network/chain";

export const wagmiConfig = createConfig({
  chains: [CHAIN],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "METOK Game",
        url: window.location.origin,
      },
    }),
    injected(),
  ],
  transports: {
    [CHAIN.id]: http(),
  },
});
