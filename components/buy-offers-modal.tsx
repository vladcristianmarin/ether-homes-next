import { Button } from '@nextui-org/button';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@nextui-org/modal';
import React from 'react';
import { toast } from 'react-toastify';

import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';

interface IBuyOffersModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  buyers: string[];
  nftId: bigint;
}

const BuyOffersModal: React.FC<IBuyOffersModalProps> = ({
  isOpen,
  onOpenChange,
  buyers,
  nftId,
}) => {
  const { account } = useWallet();
  const { marketplace } = useContracts();

  const handleAcceptBuyer = async (buyer: string) => {
    if (account != null && marketplace != null) {
      try {
        const transaction = await marketplace
          .connect(account)
          .acceptOffer(nftId, buyer);

        await transaction.wait();
        toast('Buyer accepted!', { type: 'success' });
      } catch (err: any) {
        console.log(err);
        toast('Something went wrong!', { type: 'error' });
      }
    } else {
      toast('Something went wrong!', { type: 'error' });
    }
  };

  return (
    <Modal size="lg" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Addresses of buyers
            </ModalHeader>
            <ModalBody>
              {buyers?.map((buyer, index) => (
                <div
                  key={`${buyer}-${index}`}
                  className="mb-4 flex items-center gap-6"
                >
                  <p className="text-sm font-medium">{buyer}</p>
                  <Button
                    color="success"
                    variant="light"
                    onClick={() => handleAcceptBuyer(buyer)}
                  >
                    Accept buyer
                  </Button>
                </div>
              ))}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default BuyOffersModal;
