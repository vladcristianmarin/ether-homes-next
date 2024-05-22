import {
  Button,
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
import axios from 'axios';
import { useState } from 'react';
import { FaCheck, FaEye, FaFile } from 'react-icons/fa6';
import { toast } from 'react-toastify';

import { useContracts } from '@/context/contracts-context';
import type { RealEstate } from '@/typechain-types';
import { bigNumberToDate, createPropertyJSON } from '@/utils';

interface IInspectorUnverifiedPropertyProps {
  properties: RealEstate.PropertyStruct[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const InspectorUnverifiedPropertyTable: React.FunctionComponent<
  IInspectorUnverifiedPropertyProps
> = ({ properties, isLoading, refetch }) => {
  const { realEstate } = useContracts();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedProperty, setSelectedProperty] =
    useState<RealEstate.PropertyStruct | null>(null);
  const [loadingApprove, setLoadingApprove] = useState<boolean>(false);

  const handleViewProperty = (property: RealEstate.PropertyStruct) => {
    setSelectedProperty(property);
    onOpen();
  };

  const handleCreateIPFS = async (property: RealEstate.PropertyStruct) => {
    const propertyJSON = createPropertyJSON(property);

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        propertyJSON,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const ipfsURI = response.data.IpfsHash;

      await realEstate?.assignIpfsFile(
        property.owner,
        property.id,
        `ipfs://${ipfsURI}`,
      );
      toast('Successfully created and assigned IPFS file', {
        type: 'success',
        autoClose: 500,
      });
    } catch (e: any) {
      toast('Something went wrong!', { type: 'error' });
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (selectedProperty == null) return;
    setLoadingApprove(true);
    try {
      await realEstate?.verifyProperty(
        selectedProperty.owner,
        selectedProperty.id,
      );
      await refetch();
      onClose();
      toast(`Property ${selectedProperty.id} approved`, {
        autoClose: 500,
        type: 'success',
      });
    } catch (e: any) {
      toast('Something went wrong, transaction reverted', {
        type: 'error',
      });
      console.error(e);
    } finally {
      setLoadingApprove(false);
    }
  };

  return (
    <>
      <Table aria-label="Inspector properties table" removeWrapper isStriped>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Address</TableColumn>
          <TableColumn>City</TableColumn>
          <TableColumn>Created At</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          items={properties}
          emptyContent="You have no unverified properties"
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
                <div className="relative flex items-center gap-3">
                  <Tooltip content="Approve inspection" delay={200}>
                    <Button
                      isIconOnly
                      aria-label="Approve inspection"
                      variant="light"
                      color="success"
                      className="cursor-pointer text-lg text-success-400 active:opacity-50"
                      isLoading={
                        property.id === selectedProperty?.id && loadingApprove
                      }
                    >
                      <FaCheck />
                    </Button>
                  </Tooltip>
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
                  <Tooltip
                    content={
                      property.ipfsFile.length === 0
                        ? 'Create IPFS file'
                        : 'View IPFS file'
                    }
                    delay={200}
                  >
                    <Button
                      isIconOnly
                      aria-label="Create File"
                      variant="light"
                      className="cursor-pointer text-lg text-default-400 active:opacity-50"
                      onPress={() => {
                        if (property.ipfsFile.length === 0) {
                          handleCreateIPFS(property);
                        } else {
                          window.open(
                            property.ipfsFile,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }
                      }}
                    >
                      <FaFile />
                    </Button>
                  </Tooltip>
                </div>
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
                <Button
                  color="success"
                  onPress={handleApprove}
                  className="text-white"
                  isLoading={loadingApprove}
                >
                  Approve
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default InspectorUnverifiedPropertyTable;
