import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { WalletProvider } from "./core/wallet/WalletProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <BrowserRouter basename="/game">
        <App />
      </BrowserRouter>
    </WalletProvider>
  </StrictMode>
);
