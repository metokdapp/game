import { useAccount, useConnect, useDisconnect } from "wagmi";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const metaMask = connectors.find(
    (connector) => connector.name.toLowerCase().includes("metamask")
  );

  return (
    <header>
      <h1>METOK GAME</h1>

      {isConnected ? (
        <div>
          <span>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>

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
