'use client';

import { Spinner } from '@nextui-org/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ListedPropertyItem from '@/components/listed-property-item';
import { useContracts } from '@/context/contracts-context';
import type { SimplifiedTokenizedProperty } from '@/models/TokenizedProperty';
import type { Marketplace } from '@/typechain-types';
import { simplifyProperty } from '@/utils';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export default function Home() {
  const { marketplace } = useContracts();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [listedPropertiesData, setListedPropertiesData] = useState<
    Marketplace.ListingStructOutput[]
  >([]);

  const [properties, setProperties] = useState<SimplifiedTokenizedProperty[]>(
    [],
  );

  const fetchProperties = useCallback(async () => {
    if (marketplace) {
      setIsLoading(true);
      try {
        const listedProperties = await marketplace.getActiveListings();
        setListedPropertiesData(listedProperties);

        const properties = await Promise.all(
          listedProperties.map(
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
      } catch (err: any) {
        console.log(err);
        toast('Something went wrong!', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [marketplace]);

  useEffect(() => {
    fetchProperties().then();
  }, [fetchProperties]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 self-center">
          <Spinner />
          <p className="text-sm font-medium">
            Loading your listed properties...
          </p>
        </div>
      ) : !properties || properties.length <= 0 ? (
        <p className="self-center text-sm font-medium">
          There are no listed properties yet :(
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {properties.map((property, index) => (
            <ListedPropertyItem
              isDashboard={false}
              key={`${property.name}-${index}`}
              property={property}
              marketplaceData={listedPropertiesData[index]}
              refetch={fetchProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}
