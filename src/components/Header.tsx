import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useMetok } from "../core/metok/useMetok";
import { useMonBalance } from "../core/network/useMonBalance";
import { NetworkStatus } from "../core/network/NetworkStatus";
import { formatBalance } from "../core/formatBalance";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const {
    formattedBalance: metokBalance,
    isLoading: metokLoading,
  } = useMetok();

  const {
    formattedBalance: monBalance,
    isLoading: monLoading,
  } = useMonBalance();

  const metaMask = connectors.find(
    (connector) => connector.name.toLowerCase().includes("metamask")
  );

  return (
    <header>
      <h1>METOK GAME</h1>

      {isConnected ? (
        <div>
          <div>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>

          <NetworkStatus />

          <div>
            MON: {monLoading ? "Loading..." : formatBalance(monBalance)}
          </div>

          <div>
            METOK: {metokLoading ? "Loading..." : formatBalance(metokBalance)}
          </div>

          <button onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => metaMask && connect({ connector: metaMask })}
          disabled={!metaMask || isPending}
        >
          {isPending ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}
    </header>
  );
}
