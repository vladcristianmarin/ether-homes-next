import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import type { Eip1193Provider, JsonRpcSigner } from 'ethers';
import { BrowserProvider } from 'ethers';
import type { PropsWithChildren } from 'react';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface IWalletContext {
  walletProvider: Eip1193Provider | undefined;
  address: `0x${string}` | undefined;
  provider: BrowserProvider | undefined;
  account: JsonRpcSigner | undefined;
  isLoadingWallet?: boolean;
}

const WalletContext = createContext<IWalletContext>({} as IWalletContext);

const WalletContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>();
  const [provider, setProvider] = useState<BrowserProvider>();
  const [account, setAccount] = useState<JsonRpcSigner>();

  useEffect(() => {
    if (walletProvider != null) {
      setProvider(new BrowserProvider(walletProvider));
    }
  }, [walletProvider]);

  useEffect(() => {
    const fetchSigner = async () => {
      if (provider != null && address != null) {
        try {
          setIsLoadingWallet(true);
          const signer = await provider.getSigner(address);
          setAccount(signer);
        } catch (e: any) {
          console.error(e);
        } finally {
          setIsLoadingWallet(false);
        }
      }
    };

    fetchSigner().then().catch();
  }, [address, provider]);

  const contextValue = useMemo(
    () => ({ walletProvider, address, provider, account, isLoadingWallet }),
    [walletProvider, address, provider, account, isLoadingWallet],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContextProvider;

export const useWallet = () => useContext(WalletContext);
