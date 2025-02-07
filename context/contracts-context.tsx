import { Contract } from 'ethers';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import EscrowAbi from '@/abis/Escrow.json';
import MarketplaceAbi from '@/abis/Marketplace.json';
import RealEstateAbi from '@/abis/RealEstate.json';
import type { Escrow, Marketplace, RealEstate } from '@/typechain-types';

import { useWallet } from './wallet-context';

interface IContractsContext {
  realEstateAddress: string | undefined;
  realEstate: RealEstate | undefined;
  marketplaceAddress: string | undefined;
  marketplace: Marketplace | undefined;
  isInspector: boolean;
  loadingInspectorStatus: boolean | undefined;
  getEscrowContract: (escrowAddress: string) => Escrow | null;
}

const ContractsContext = createContext<IContractsContext>(
  {} as IContractsContext,
);

const ContractsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { account } = useWallet();

  const [realEstate, setRealEstate] = useState<RealEstate>();
  const [realEstateAddress, setRealEstateAddress] = useState<string>();

  const [marketplace, setMarketplace] = useState<Marketplace>();
  const [marketplaceAddress, setMarketplaceAddress] = useState<string>();

  const [isInspector, setIsInspector] = useState<boolean>(false);
  const [loadingInspectorStatus, setLoadingInspectorStatus] =
    useState<boolean>();

  useEffect(() => {
    const createRealEstateContract = async () => {
      if (account != null) {
        // @ts-expect-error
        const realEstateContract: RealEstate = new Contract(
          RealEstateAbi.address,
          RealEstateAbi.abi,
          account,
        );

        setRealEstate(realEstateContract);
        setRealEstateAddress(RealEstateAbi.address);
      }
    };

    const createMarketplaceContract = async () => {
      if (account != null) {
        // @ts-expect-error
        const marketplaceContract: Marketplace = new Contract(
          MarketplaceAbi.address,
          MarketplaceAbi.abi,
          account,
        );

        setMarketplace(marketplaceContract);
        setMarketplaceAddress(MarketplaceAbi.address);
      }
    };

    createRealEstateContract().then().catch();
    createMarketplaceContract().then().catch();
  }, [account]);

  useEffect(() => {
    const isInspector = async () => {
      if (account != null && realEstate != null) {
        setLoadingInspectorStatus(true);
        const result = await realEstate.connect(account).isInspector();
        setIsInspector(result);
        setLoadingInspectorStatus(false);
      }
    };

    isInspector().then().catch();
  }, [account, realEstate]);

  const getEscrowContract = useCallback((escrowAddress: string) => {
    if (escrowAddress === '0x0000000000000000000000000000000000000000')
      return null;

    const escrow = new Contract(escrowAddress, EscrowAbi.abi);

    // @ts-ignore
    return escrow as Escrow;
  }, []);

  const contextValue = useMemo(
    () => ({
      realEstate,
      realEstateAddress,
      marketplace,
      marketplaceAddress,
      isInspector,
      loadingInspectorStatus,
      getEscrowContract,
    }),
    [
      getEscrowContract,
      isInspector,
      loadingInspectorStatus,
      marketplace,
      marketplaceAddress,
      realEstate,
      realEstateAddress,
    ],
  );

  return (
    <ContractsContext.Provider value={contextValue}>
      {children}
    </ContractsContext.Provider>
  );
};

export default ContractsContextProvider;

export const useContracts = () => useContext(ContractsContext);
