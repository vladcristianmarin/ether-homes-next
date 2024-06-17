// components/OwnedTokens.js

import { Button, Spinner, Tooltip, useDisclosure } from '@nextui-org/react';
import type { AddressLike } from 'ethers';
import React, { useEffect, useRef, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { MdOutlineSell } from 'react-icons/md';
import { toast } from 'react-toastify';

import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';

import ListPropertyModal from './list-property-modal';

interface OwnedTokensTableProps {
  tokens: bigint[];
  isLoading: boolean;
}

const OwnedTokensTable: React.FC<OwnedTokensTableProps> = ({
  tokens,
  isLoading,
}) => {
  const { account } = useWallet();
  const { realEstate, marketplace, realEstateAddress, marketplaceAddress } =
    useContracts();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [tokenForListing, setTokenForListing] = useState<bigint>(BigInt(0));

  const lock = useRef<boolean>(false);

  useEffect(() => {
    if (marketplace && realEstate && account) {
      const event = marketplace.getEvent('PropertyListed');

      // Asumam ca nftId === propertyId (ceea ce ar trb sa fie)
      marketplace.connect(account).on(event, async (nftId) => {
        if (!lock.current) {
          lock.current = true;
          const transaction = await realEstate
            .connect(account)
            .updateListedProperty(nftId, true);

          await transaction.wait();

          lock.current = false;
        }

        toast('Property listed successfully!', { type: 'success' });
      });
    }
  }, [account, marketplace, realEstate]);

  const handleOpenTokenURI = async (token: bigint) => {
    if (realEstate) {
      try {
        const tokenURI = await realEstate.tokenURI(token);

        if (tokenURI) {
          window.open(tokenURI, '_blank', 'noopener,noreferrer');
        }
      } catch (e: any) {
        toast('Open token URI failed', { type: 'error' });
      }
    }
  };

  const handleListOnSale = async (token: bigint) => {
    setTokenForListing(token);
    onOpen();
  };

  const handleConfirmList = async (price: number) => {
    if (marketplace && realEstate) {
      try {
        const tokenURI = await realEstate.tokenURI(tokenForListing);

        let transaction = await marketplace.listProperty(
          tokenForListing,
          tokenURI,
          price,
        );

        await transaction.wait();

        transaction = await realEstate
          .connect(account)
          .approve(marketplaceAddress as AddressLike, tokenForListing);

        await transaction.wait();
        onClose();
      } catch (err: any) {
        toast('Listing property failed', { type: 'error' });
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex w-full  items-center justify-between">
        <h2 className="mx-2 text-medium font-semibold ">Owned tokens</h2>
        {isLoading && <Spinner />}
        <Button
          variant="light"
          color="success"
          onPress={async () => {
            await navigator.clipboard.writeText(realEstateAddress ?? '');
            toast('Contract address copied', { type: 'success' });
          }}
        >
          Copy contract address
        </Button>
      </div>
      <div className="w-full flex-col gap-2">
        {tokens.map((token: bigint, index) => (
          <div
            key={`${token}-${index}`}
            className="my-2 flex items-center justify-between px-2"
          >
            <p className="text-sm font-semibold">
              TOKEN_ID: {token.toString()}
            </p>

            <div className="flex items-center gap-4">
              <Tooltip content="Open Token URI" delay={200}>
                <Button
                  aria-label="Open Token URI"
                  color="secondary"
                  isIconOnly
                  onPress={() => handleOpenTokenURI(token)}
                  className="w-24"
                >
                  <div className="flex items-center gap-3">
                    <p>View</p>
                    <FaExternalLinkAlt size={14} />
                  </div>
                </Button>
              </Tooltip>
              <Button
                aria-label="List propery on sale"
                color="primary"
                isIconOnly
                onPress={() => handleListOnSale(token)}
                className="w-32"
              >
                <div className="flex items-center gap-3">
                  <p>List on sale</p>
                  <MdOutlineSell size={18} />
                </div>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ListPropertyModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        handleList={handleConfirmList}
        token={tokenForListing}
      />
    </div>
  );
};

export default OwnedTokensTable;
