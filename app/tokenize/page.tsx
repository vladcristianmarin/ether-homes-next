'use client';

import { Card } from '@nextui-org/card';
import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { CreatePropertyForm } from '@/components/create-property-form';
import CreatedPropertiesTable from '@/components/created-properties-table';
import OwnedTokensTable from '@/components/owned-tokens-table';
import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import type { RealEstate } from '@/typechain-types';

const TokenizePage: NextPage = () => {
  const { account } = useWallet();
  const { realEstate, marketplace } = useContracts();
  const [properties, setProperties] = useState<RealEstate.PropertyStruct[]>([]);
  const [tokens, setTokens] = useState<bigint[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] =
    useState<boolean>(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (realEstate && account) {
      setIsLoadingProperties(true);
      try {
        const properties = await realEstate.getCreatedProperties();
        setIsLoadingTokens(true);
        const tokens = await realEstate.getOwnedTokens(account);
        setProperties(properties);
        setTokens(tokens);
      } catch (e: any) {
        toast('Fetch properties failed', { type: 'error' });
      } finally {
        setIsLoadingProperties(false);
        setIsLoadingTokens(false);
      }
    }
  }, [account, realEstate]);

  useEffect(() => {
    load().then().catch();
  }, [account, load, realEstate]);

  useEffect(() => {
    let propertyCreated = null;
    let tokenCreated = null;
    if (realEstate && account) {
      propertyCreated = realEstate.getEvent('PropertyCreated');
      realEstate.connect(account).on(propertyCreated, async () => {
        await load();
      });

      tokenCreated = realEstate.getEvent('TokenCreated');
      realEstate.connect(account).on(tokenCreated, async () => {
        await load();
      });
    }

    return () => {
      if (realEstate) {
        if (propertyCreated) realEstate.removeAllListeners(propertyCreated);
        if (tokenCreated) realEstate.removeAllListeners(tokenCreated);
      }
    };
  }, [account, load, realEstate]);

  useEffect(() => {
    let event = null;
    if (marketplace && account) {
      event = marketplace.getEvent('PropertyListed');

      marketplace.connect(account).on(event, async () => {
        await load();
      });
    }

    return () => {
      if (event && marketplace) marketplace.removeAllListeners(event);
    };
  }, [account, load, marketplace]);

  return (
    <div className="grid min-h-max w-full grid-cols-9 gap-4">
      <div className="col-span-5 flex h-full flex-col gap-4 ">
        <Card className="grow p-2">
          <CreatedPropertiesTable
            isLoading={isLoadingProperties}
            properties={properties}
            reload={load}
          />
        </Card>

        <Card className="items-start p-2">
          <OwnedTokensTable tokens={tokens} isLoading={isLoadingTokens} />
        </Card>
      </div>

      <Card className="col-span-4 h-full p-2">
        <CreatePropertyForm />
      </Card>
    </div>
  );
};

export default TokenizePage;
