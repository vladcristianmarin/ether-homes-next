import {
  Button,
  Chip,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
import { useState } from 'react';
import { FaEye } from 'react-icons/fa6';

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
                    className="cursor-pointer text-lg text-default-400 active:opacity-50"
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
      <Modal size="xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Property Details
              </ModalHeader>
              {selectedProperty != null ? (
                <ModalBody className="items-start">
                  <div className="flex flex-row items-center gap-3">
                    <p className="font-semibold">ID:</p>
                    <p>{selectedProperty.id.toString()}</p>
                  </div>
                  <div className="flex flex-row items-center gap-3">
                    <p className="font-semibold">Owner:</p>
                    <p>{selectedProperty.owner.toString()}</p>
                  </div>
                  <div className="flex flex-row items-center gap-3">
                    <p className="font-semibold">Address:</p>
                    <p>
                      {selectedProperty.city}, {selectedProperty.propertAddress}
                    </p>
                  </div>
                  <div className="flex flex-row items-center gap-3">
                    <p className="font-semibold">Rooms:</p>
                    <p>{`Total ${selectedProperty.rooms.toString()} | Bathrooms ${selectedProperty.bathrooms.toString()}`}</p>
                  </div>
                  <div className="flex flex-row items-center gap-3">
                    <p className="font-semibold">Year of construction:</p>
                    <p>{selectedProperty.yearOfConstruction.toString()}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">Documents :</p>
                    {selectedProperty.documentsUris.map((uri, index) => (
                      <Tooltip content={uri} key={`${uri}-${index}`}>
                        <Link isExternal showAnchorIcon href={uri}>
                          {uri.length > 18
                            ? `${uri.slice(0, 18)}...${uri.slice(uri.length - 8, -1)}`
                            : uri}
                        </Link>
                      </Tooltip>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">Images :</p>
                    {selectedProperty.imagesUris.map((uri, index) => (
                      <Tooltip content={uri} key={`${uri}-${index}`}>
                        <Link isExternal showAnchorIcon href={uri}>
                          {uri.length > 18
                            ? `${uri.slice(0, 18)}...${uri.slice(uri.length - 8, -1)}`
                            : uri}
                        </Link>
                      </Tooltip>
                    ))}
                  </div>
                </ModalBody>
              ) : null}
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default InspectorAllPropertyTable;
