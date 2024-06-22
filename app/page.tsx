'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';

import ListedPropertyItem from '@/components/listed-property-item';
import { useContracts } from '@/context/contracts-context';
import type { SimplifiedTokenizedProperty } from '@/models/TokenizedProperty';
import type { Marketplace } from '@/typechain-types';
import { simplifyProperty } from '@/utils';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export default function Home() {
  const { marketplace } = useContracts();

  const [listedPropertiesData, setListedPropertiesData] = useState<
    Marketplace.ListingStructOutput[]
  >([]);

  const [properties, setProperties] = useState<SimplifiedTokenizedProperty[]>(
    [],
  );

  useEffect(() => {
    const fetchProperties = async () => {
      if (marketplace) {
        const listedProperties = await marketplace.getAllListed();
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
      }
    };

    fetchProperties().then();
  }, [marketplace]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {properties.map((property, index) => (
        <ListedPropertyItem
          key={`${property.name}-${index}`}
          property={property}
          marketplaceData={listedPropertiesData[index]}
        />
      ))}
    </div>
  );
}
