import {
  Button,
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
import React, { useState } from 'react';
import { FaCheck, FaEye, FaFile } from 'react-icons/fa6';
import { toast } from 'react-toastify';

import InspectorPropertyModal from '@/components/inspector-property-modal';
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

  const [creatingIPFSFileID, setCreatingIPFSFileID] = useState<string>('');

  const handleViewProperty = (property: RealEstate.PropertyStruct) => {
    setSelectedProperty(property);
    onOpen();
  };

  const handleCreateIPFS = async (property: RealEstate.PropertyStruct) => {
    setCreatingIPFSFileID(property.id.toString());
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
    } finally {
      setCreatingIPFSFileID('');
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
                      color="primary"
                      className="cursor-pointer text-lg active:opacity-50"
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
                      color={
                        property.ipfsFile.length === 0 ? 'primary' : 'success'
                      }
                      className="cursor-pointer text-lg  active:opacity-50"
                      isLoading={creatingIPFSFileID === property.id.toString()}
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
      <InspectorPropertyModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        selectedProperty={selectedProperty}
        loadingApprove={loadingApprove}
        handleApprove={handleApprove}
      />
    </>
  );
};

export default InspectorUnverifiedPropertyTable;
