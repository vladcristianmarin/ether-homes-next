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
import React, { useState } from 'react';
import { FaCheck, FaEthereum } from 'react-icons/fa6';
import { IoClose, IoReload } from 'react-icons/io5';
import { toast } from 'react-toastify';

import { useContracts } from '@/context/contracts-context';
import type { RealEstate } from '@/typechain-types';
import { bigNumberToDate } from '@/utils';

interface CreatedPropertiesTableProps {
  isLoading: boolean;
  properties: RealEstate.PropertyStruct[];
  reload: () => Promise<void>;
}

const CreatedPropertiesTable: React.FC<CreatedPropertiesTableProps> = ({
  isLoading,
  properties,
  reload,
}) => {
  const { realEstate } = useContracts();

  const [tokenizingPropertyId, setTokenizingPropertyId] = useState<string>('');

  const handleTokenizeProperty = async (
    property: RealEstate.PropertyStruct,
  ) => {
    if (realEstate) {
      try {
        setTokenizingPropertyId(property.id.toString());
        await realEstate.createTokenURI(property.id);
        await reload();
        toast('Tokenize property success', { type: 'success' });
      } catch (e: any) {
        toast('Tokenize property failed', { type: 'error' });
      } finally {
        setTokenizingPropertyId('');
      }
    }
  };

  return (
    <div>
      <div className="mb-4 flex w-full  items-center justify-between">
        <h2 className="mx-2 text-medium font-semibold ">Created properties</h2>
        <Tooltip
          content={isLoading ? 'Fetching data...' : 'Refetch data'}
          offset={15}
          delay={500}
        >
          <Button
            isIconOnly
            aria-label="Reset"
            variant="light"
            onPress={reload}
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
          {properties.map(
            (property: RealEstate.PropertyStruct, index: number) => (
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
                <TableCell>
                  {property.isTokenized ? (
                    <FaCheck size={20} className="text-green-500" />
                  ) : (
                    <IoClose size={20} className="text-red-500" />
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
                      isLoading={
                        tokenizingPropertyId === property.id.toString()
                      }
                      onPress={() => handleTokenizeProperty(property)}
                    >
                      <FaEthereum className="text-purple-700" />
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CreatedPropertiesTable;
