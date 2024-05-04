"use client";

import { Web3Modal } from "@web3modal/ethers/dist/types/src/client";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";
import { useTheme } from "next-themes";
import { PropsWithChildren, useEffect, useState } from "react";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

const hardhat = {
  chainId: 1337,
  name: "Hardhat",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: "http://127.0.0.1:8545/",
};

const metadata = {
  name: "EtherHomes",
  description: "No descriptions",
  url: "https://example.com",
  icons: ["https://avatars.mywebsite.com/"],
};

const ethersConfig = defaultConfig({
  metadata,

  rpcUrl: "http://127.0.0.1:8545/",
  defaultChainId: 1337,
});

export const Web3ModalProivder: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [modal, setModal] = useState<Web3Modal | null>(null);

  useEffect(() => {
    const w3m = createWeb3Modal({
      ethersConfig,
      chains: [hardhat],
      projectId: projectId as string,
      enableAnalytics: false,
      themeMode: "light",
    });

    if (w3m != null) {
      setModal(w3m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modal != null) {
      modal.setThemeMode(theme as "light" | "dark");
    }
  }, [modal, theme]);

  return children;
};
