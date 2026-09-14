import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useMetok } from "../core/metok/useMetok";
import { useMonBalance } from "../core/network/useMonBalance";
import { formatBalance } from "../core/formatBalance";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const { formattedBalance: metokBalance, isLoading: metokLoading } = useMetok();
  const { formattedBalance: monBalance, isLoading: monLoading } = useMonBalance();

  const metaMask = connectors.find(
    (connector) => connector.name.toLowerCase().includes("metamask")
  );

  return (
    <header className="site-header">
      <div className="brand">
        <div className="brand-mark">M</div>

        <div className="brand-copy">
          <strong>METOK GAME</strong>
          <span>On-chain gaming hub</span>
        </div>
      </div>

      <div className="wallet-area">
        {isConnected ? (
          <>
            <div className="wallet-info">
              <span className="wallet-chip">
                METOK {metokLoading ? "..." : formatBalance(metokBalance)}
              </span>

              <span className="wallet-chip">
                MON {monLoading ? "..." : formatBalance(monBalance)}
              </span>

              <span className="wallet-chip">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>

            <button
              className="wallet-button secondary"
              onClick={() => disconnect()}
            >
              Ngừng kết nối
            </button>
          </>
        ) : (
          <button
            className="wallet-button"
            onClick={() => metaMask && connect({ connector: metaMask })}
            disabled={!metaMask || isPending}
          >
            {isPending ? "Đang kết nối..." : "Connect MetaMask"}
          </button>
        )}
      </div>
    </header>
  );
}
