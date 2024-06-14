// components/OwnedTokens.js

import { Button, Spinner, Tooltip } from '@nextui-org/react';
import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { MdOutlineSell } from 'react-icons/md';
import { toast } from 'react-toastify';

import { useContracts } from '@/context/contracts-context';

interface OwnedTokensTableProps {
  tokens: bigint[];
  isLoading: boolean;
}

const OwnedTokensTable: React.FC<OwnedTokensTableProps> = ({
  tokens,
  isLoading,
}) => {
  const { realEstate, realEstateAddress } = useContracts();

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

  const handleListOnSale = async (token: bigint) => {};

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
            className="flex items-center justify-between px-2"
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
    </div>
  );
};

export default OwnedTokensTable;
