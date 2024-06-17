import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@nextui-org/react';
import { useState } from 'react';

interface IListPropertyModalProps {
  token: bigint;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  handleList: (price: number) => void;
}

const ListPropertyModal = ({
  token,
  isOpen,
  onOpenChange,
  handleList,
}: IListPropertyModalProps) => {
  const [price, setPrice] = useState<number>(0);

  return (
    <Modal size="md" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              List Token {token.toString()} on sale
            </ModalHeader>
            <ModalBody className="items-center">
              <Input
                errorMessage="Please provide a price"
                value={price.toString()}
                required
                isRequired
                type="number"
                label="Price"
                placeholder="0.00"
                labelPlacement="outside"
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-small text-default-400">ETH</span>
                  </div>
                }
                onValueChange={(value) => setPrice(Number(value))}
              />
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>

              <Button
                color="success"
                onPress={() => {
                  handleList(price);
                }}
                className="text-white"
              >
                Sale
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ListPropertyModal;
