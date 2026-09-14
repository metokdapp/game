import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CHAIN } from "./chain";

export function NetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  const isMonad = chainId === CHAIN.id;

  if (isMonad) {
    return <span>Monad ✓</span>;
  }

  return (
    <button
      type="button"
      onClick={() => switchChain({ chainId: CHAIN.id })}
      disabled={isPending}
    >
      {isPending ? "Switching..." : "Switch to Monad"}
    </button>
  );
}
