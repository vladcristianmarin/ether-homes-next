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
import { toast } from 'react-toastify';

import { CreatePropertyForm } from '@/components/create-property-form';
import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import type { RealEstate } from '@/typechain-types';
import { bigNumberToDate } from '@/utils';

const TokenizePage: NextPage = () => {
  const { account } = useWallet();
  const { realEstate, realEstateAddress } = useContracts();
  const [properties, setProperties] = useState<RealEstate.PropertyStruct[]>([]);
  const [tokens, setTokens] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (realEstate && account) {
      setIsLoading(true);
      try {
        const properties = await realEstate.getCreatedProperties();
        const tokens = await realEstate.getOwnedTokens(account);
        setProperties(properties);
        setTokens(tokens);
      } catch (e: any) {
        toast('Fetch properties failed', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [account, realEstate]);

  const handleTokenizeProperty = async (
    property: RealEstate.PropertyStruct,
  ) => {
    if (realEstate) {
      try {
        await realEstate.createTokenURI(property.id);
        await load();
        toast('Tokenize property success', { type: 'success' });
      } catch (e: any) {
        toast('Tokenize property failed', { type: 'error' });
      }
    }
  };

  const handleOpenTokenURI = async (token: bigint) => {
    if (realEstate) {
      try {
        const tokenURI = await realEstate.tokenURI(token);
        console.log(tokenURI);
        if (tokenURI) {
          window.open(tokenURI, '_blank', 'noopener,noreferrer');
        }
      } catch (e: any) {
        toast('Open token URI failed', { type: 'error' });
      }
    }
  };

  useEffect(() => {
    load().then().catch();
  }, [account, load, realEstate]);

  useEffect(() => {
    if (realEstate && account) {
      realEstate
        .connect(account)
        .on(realEstate.getEvent('PropertyCreated'), async () => {
          await load();
        });
    }
  }, [account, load, realEstate]);

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
              <TableColumn>Actions</TableColumn>
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
                    <p>{bigNumberToDate(property.createdAt)}</p>
                  </TableCell>
                  <TableCell>
                    <Tooltip content="Tokenize property" delay={200}>
                      <Button
                        isIconOnly
                        aria-label="Tokenize property"
                        variant="light"
                        color="secondary"
                        className="cursor-pointer text-lg active:opacity-50"
                        disabled={property.isTokenized}
                        isDisabled={property.isTokenized}
                        onPress={() => handleTokenizeProperty(property)}
                      >
                        <FaEthereum className="text-purple-700" />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="items-start p-2">
          <Button
            variant="light"
            color="success"
            onPress={() => {
              navigator.clipboard.writeText(realEstateAddress ?? '');
              toast('Contract address copied', { type: 'success' });
            }}
          >
            Copy contract address
          </Button>
          {tokens.map((token, index) => (
            <div
              key={`${token}-${index}`}
              className="flex w-full items-center justify-between"
            >
              <p>Token ID: {token.toString()}</p>
              <Button
                variant="light"
                onPress={() => {
                  handleOpenTokenURI(token);
                }}
              >
                Open token URI
              </Button>
            </div>
          ))}
        </Card>
      </div>

      <Card className="col-span-4 h-full p-2">
        <CreatePropertyForm />
      </Card>
    </div>
  );
};

export default TokenizePage;
