// components/OwnedTokens.js

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
} from '@nextui-org/react';
import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
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

  return (
    <div className="w-full">
      <div className="mb-4 flex w-full  items-center justify-between">
        <h2 className="mx-2 text-medium font-semibold ">Owned tokens</h2>
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
      <Table aria-label="Owned Tokens Table" removeWrapper isStriped>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          items={tokens}
          emptyContent="You don't own any tokens yet"
          loadingContent={<Spinner size="lg" color="primary" />}
          isLoading={isLoading}
        >
          {tokens.map((token: bigint, index) => (
            <TableRow textValue="Token" key={`${index}`}>
              <TableCell>{token.toString()}</TableCell>
              <TableCell>
                <Tooltip content="Open Token URI" delay={200}>
                  <Button
                    aria-label="Open Token URI"
                    variant="light"
                    color="primary"
                    isIconOnly
                    onPress={() => handleOpenTokenURI(token)}
                  >
                    <FaExternalLinkAlt />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OwnedTokensTable;
