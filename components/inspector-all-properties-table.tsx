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
  useDisclosure,
} from '@nextui-org/react';
import React, { useState } from 'react';
import { FaEye } from 'react-icons/fa6';

import InspectorPropertyModal from '@/components/inspector-property-modal';
import type { RealEstate } from '@/typechain-types';
import { bigNumberToDate } from '@/utils';

interface IInspectorAllPropertyProps {
  properties: RealEstate.PropertyStruct[];
  isLoading: boolean;
}

const InspectorAllPropertyTable: React.FunctionComponent<
  IInspectorAllPropertyProps
> = ({ properties, isLoading }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedProperty, setSelectedProperty] =
    useState<RealEstate.PropertyStruct | null>(null);

  const handleViewProperty = (property: RealEstate.PropertyStruct) => {
    setSelectedProperty(property);
    onOpen();
  };

  return (
    <>
      <Table aria-label="Inspector properties table" removeWrapper isStriped>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Address</TableColumn>
          <TableColumn>City</TableColumn>
          <TableColumn>Created At</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          items={properties}
          emptyContent="You have no assigned properties"
          loadingContent={<Spinner size="lg" color="primary" />}
          isLoading={isLoading}
        >
          {properties.map((property, index) => (
            <TableRow key={`${index}`}>
              <TableCell>{property.id.toString()}</TableCell>
              <TableCell>{property.propertAddress}</TableCell>
              <TableCell>{property.city}</TableCell>
              <TableCell>
                <p>{bigNumberToDate(property.createdAt)}</p>
              </TableCell>
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
                <Tooltip content="View property" delay={200}>
                  <Button
                    isIconOnly
                    aria-label="View property"
                    variant="light"
                    color="primary"
                    className="cursor-pointer text-lg active:opacity-50"
                    onPress={() => handleViewProperty(property)}
                  >
                    <FaEye />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InspectorPropertyModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        selectedProperty={selectedProperty}
        viewOnly
      />
    </>
  );
};

export default InspectorAllPropertyTable;
