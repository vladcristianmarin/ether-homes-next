import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from '@nextui-org/react';

interface InspectorUnverifiedPropertyTableProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedProperty: any;
  loadingApprove?: boolean;
  handleApprove?: () => void;
  viewOnly?: boolean;
}

export const InspectorUnverifiedPropertyTable = ({
  isOpen,
  onOpenChange,
  selectedProperty,
  loadingApprove,
  handleApprove,
  viewOnly,
}: InspectorUnverifiedPropertyTableProps) => {
  return (
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
                  {selectedProperty.documentsUris.map(
                    (uri: string, index: number) => (
                      <Tooltip content={uri} key={`${uri}-${index}`}>
                        <Link isExternal showAnchorIcon href={uri}>
                          {uri.length > 18
                            ? `${uri.slice(0, 18)}...${uri.slice(uri.length - 8, -1)}`
                            : uri}
                        </Link>
                      </Tooltip>
                    ),
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">Images :</p>
                  {selectedProperty.imagesUris.map(
                    (uri: string, index: number) => (
                      <Tooltip content={uri} key={`${uri}-${index}`}>
                        <Link isExternal showAnchorIcon href={uri}>
                          {uri.length > 18
                            ? `${uri.slice(0, 18)}...${uri.slice(uri.length - 8, -1)}`
                            : uri}
                        </Link>
                      </Tooltip>
                    ),
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <p className="font-semibold">IPFS file</p>
                  {selectedProperty.ipfsFile.length > 0 ? (
                    <Tooltip content="View IPFS file">
                      <Link
                        isExternal
                        showAnchorIcon
                        href={selectedProperty.ipfsFile}
                      >
                        {selectedProperty.ipfsFile.length > 18
                          ? `${selectedProperty.ipfsFile.slice(0, 18)}...${selectedProperty.ipfsFile.slice(
                              selectedProperty.ipfsFile.length - 8,
                              -1,
                            )}`
                          : selectedProperty.ipfsFile}
                      </Link>
                    </Tooltip>
                  ) : null}
                </div>
              </ModalBody>
            ) : null}
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              {!viewOnly ? (
                <Button
                  color="success"
                  onPress={handleApprove}
                  className="text-white"
                  isLoading={loadingApprove}
                >
                  Approve
                </Button>
              ) : null}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default InspectorUnverifiedPropertyTable;
