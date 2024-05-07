import { Contract } from 'ethers';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import RealEstateAbi from '@/abis/RealEstate.json';
import type { RealEstate } from '@/typechain-types';

import { useWallet } from './wallet-context';

interface IContractsContext {
  realEstateAddress: string | undefined;
  realEstate: RealEstate | undefined;
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

        if (realEstateContract) {
          setRealEstate(realEstateContract);
        }
      }
    };

    createRealEstateContract().then().catch();
  }, [account]);

  const contextValue = useMemo(
    () => ({ realEstate, realEstateAddress }),
    [realEstate, realEstateAddress],
  );

  return (
    <ContractsContext.Provider value={contextValue}>
      {children}
    </ContractsContext.Provider>
  );
};

export default ContractsContextProvider;

export const useContracts = () => useContext(ContractsContext);
