'use client';

import { Card } from '@nextui-org/card';
import {
  Button,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@nextui-org/react';
import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { FaEthereum } from 'react-icons/fa6';
import { IoClose, IoReload } from 'react-icons/io5';

import { CreatePropertyForm } from '@/components/create-property-form';
import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import type { RealEstate } from '@/typechain-types';

const TokenizePage: NextPage = () => {
  const { account } = useWallet();
  const { realEstate } = useContracts();
  const [properties, setProperties] = useState<RealEstate.PropertyStruct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const load = useCallback(() => {
    if (realEstate && account) {
      setIsLoading(true);
      realEstate
        .connect(account)
        .getCreatedProperties()
        .then((properties) => setProperties(properties))
        .finally(() => setIsLoading(false));
    }
  }, [account, realEstate]);

  useEffect(() => {
    load();
  }, [account, load, realEstate]);

  useEffect(() => {
    if (realEstate && account) {
      realEstate
        .connect(account)
        .on(realEstate.getEvent('PropertyCreated'), (property) => {
          console.log('proerty created');
          setProperties((prev) => [...prev, property]);
        });
    }
  }, [account, realEstate]);

  return (
    <div className="grid min-h-max w-full grid-cols-9 gap-4">
      <div className="col-span-5 flex h-full flex-col gap-4 ">
        <Card className="grow p-2">
          <div className="mb-4 flex w-full  items-center justify-between">
            <h2 className="mx-2 text-medium font-semibold ">
              Created properties
            </h2>
            <Tooltip
              content={isLoading ? 'Fetching data...' : 'Refetch data'}
              offset={15}
              delay={500}
            >
              <Button
                isIconOnly
                aria-label="Reset"
                variant="light"
                onPress={load}
                isLoading={isLoading}
              >
                <IoReload size={18} />
              </Button>
            </Tooltip>
          </div>
          <Table aria-label="Created properties table" removeWrapper isStriped>
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Address</TableColumn>
              <TableColumn>City</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn align="center">Tokenized</TableColumn>
              <TableColumn>Created At</TableColumn>
            </TableHeader>
            <TableBody
              items={properties}
              emptyContent="Create a property!"
              loadingContent={<Spinner size="lg" color="primary" />}
              isLoading={isLoading}
            >
              {properties.map((property, index) => (
                <TableRow key={`${index}`}>
                  <TableCell>{property.id.toString()}</TableCell>
                  <TableCell>{property.propertAddress}</TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      size="sm"
                      variant="flat"
                      color={property.verified ? 'success' : 'warning'}
                    >
                      {property.verified ? 'Verified' : 'Unverified'}
                    </Chip>
                  </TableCell>
                  <TableCell align="center">
                    {property.isTokenized ? (
                      <FaEthereum size={24} className="text-purple-700" />
                    ) : (
                      <IoClose size={24} className="text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <p>{property.createdAt.toString()}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card />
      </div>

      <Card className="col-span-4 h-full p-2">
        <CreatePropertyForm />
      </Card>
    </div>
  );
};

export default TokenizePage;
