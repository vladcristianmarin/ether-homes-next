'use client';

import { Spinner } from '@nextui-org/react';
import axios from 'axios';
import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ListedPropertyItem from '@/components/listed-property-item';
import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import type { SimplifiedTokenizedProperty } from '@/models/TokenizedProperty';
import type { Marketplace } from '@/typechain-types';
import { simplifyProperty } from '@/utils';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const BuyingPropergties: NextPage = () => {
  const { account } = useWallet();
  const { marketplace } = useContracts();

  const [marketplaceData, setMarketplaceData] = useState<
    Marketplace.ListingStructOutput[]
  >([]);

  const [properties, setProperties] = useState<SimplifiedTokenizedProperty[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchPropertiesBuyer = useCallback(async () => {
    if (marketplace && account) {
      setIsLoading(true);
      try {
        const marketData = await marketplace.getListedByBuyer(account.address);
        setMarketplaceData(marketData);

        const properties = await Promise.all(
          marketData.map(
            async (listedProperty: Marketplace.ListingStructOutput) => {
              const response = await axios.get(
                listedProperty.nftURI.replace('ipfs://', IPFS_GATEWAY),
              );

              return {
                ...simplifyProperty(response.data),
                price: Number(listedProperty.price),
              };
            },
          ),
        );

        setProperties(properties);
      } catch (err) {
        toast('Something went wrong', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [account, marketplace]);

  useEffect(() => {
    fetchPropertiesBuyer().then().catch();
  }, [fetchPropertiesBuyer]);

  useEffect(() => {
    let event = null;
    if (marketplace && account) {
      event = marketplace.getEvent('ListingCanceled');

      marketplace.connect(account).on(event, async () => {
        await fetchPropertiesBuyer();
      });
    }

    return () => {
      if (event && marketplace) marketplace.removeAllListeners(event);
    };
  }, [account, fetchPropertiesBuyer, marketplace]);

  return (
    <div className="flex w-full flex-col items-start">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 self-center">
          <Spinner />
          <p className="text-sm font-medium">Loading properties...</p>
        </div>
      ) : properties == null || properties.length === 0 ? (
        <p className="mx-auto flex text-sm font-medium">
          You are not in the proccess of buying any property
        </p>
      ) : (
        properties.map((property, index) => {
          return (
            <ListedPropertyItem
              isDashboard
              key={`${property.name}-${index}`}
              property={property}
              marketplaceData={marketplaceData[index]}
              refetch={fetchPropertiesBuyer}
            />
          );
        })
      )}
    </div>
  );
};

export default BuyingPropergties;
