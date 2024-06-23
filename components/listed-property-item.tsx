import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Image,
  useDisclosure,
} from '@nextui-org/react';
import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaEthereum } from 'react-icons/fa6';
import { LuBath, LuBedDouble, LuConstruction, LuRuler } from 'react-icons/lu';
import { toast } from 'react-toastify';

import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import type { SimplifiedTokenizedProperty } from '@/models/TokenizedProperty';
import type { Marketplace } from '@/typechain-types';

import BuyOffersModal from './buy-offers-modal';

interface IListedPropertyItemProps {
  property: SimplifiedTokenizedProperty;
  marketplaceData: Marketplace.ListingStructOutput;
  refetch: () => Promise<void>;

  isDashboard?: boolean;
}

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const aspectRatio = { x: 16, y: 9 };
const scale = 30;

const ListedPropertyItem: React.FC<IListedPropertyItemProps> = ({
  property,
  marketplaceData,
  refetch,

  isDashboard,
}) => {
  const { isOpen, onOpenChange, onOpen } = useDisclosure();

  const { account } = useWallet();
  const { marketplace, getEscrowContract } = useContracts();

  const [escrowProps, setEscrowProps] = useState<{
    state: bigint;
    approvals: boolean[];
  } | null>(null);

  const escrow = useMemo(() => {
    if (marketplaceData.escrow) {
      return getEscrowContract(marketplaceData.escrow);
    }
    return null;
  }, [getEscrowContract, marketplaceData.escrow]);

  useEffect(() => {
    const getEscrowData = async () => {
      if (escrow && account) {
        const connectedEscrow = await escrow.connect(account);

        const [state, buyer, lender] = await Promise.all([
          connectedEscrow.state(),
          connectedEscrow.buyer(),
          connectedEscrow.lender(),
        ]);

        const approvals: boolean[] = [];

        const buyersApproval = await connectedEscrow.approvals(buyer);
        approvals.push(buyersApproval);
        if (lender !== '0x0000000000000000000000000000000000000000') {
          const lendersApproval = await connectedEscrow.approvals(lender);
          approvals.push(lendersApproval);
        }

        setEscrowProps({
          state,
          approvals,
        });
      }
    };

    getEscrowData().then().catch();
  }, [escrow, account]);

  const handleBuyOffer = useCallback(async () => {
    if (account == null) {
      return toast('You need to connect an account!', { type: 'error' });
    }

    if (marketplace == null) {
      return toast('Something went wrong!', { type: 'error' });
    }

    try {
      const transaction = await marketplace
        .connect(account)
        .makeOffer(marketplaceData.nftId);

      await transaction.wait();

      toast('Buying offer succesfull! Wait for seller approval');
      await refetch();
    } catch (err: any) {
      toast('Something went wrong', { type: 'error' });
    }

    return null;
  }, [account, marketplace, marketplaceData.nftId, refetch]);

  const handlePayDeposit = useCallback(async () => {
    if (account == null) {
      return toast('You need to connect an account!', { type: 'error' });
    }

    if (marketplace == null) {
      return toast('Something went wrong!', { type: 'error' });
    }

    try {
      const transaction = await marketplace
        .connect(account)
        .payDeposit(marketplaceData.nftId, {
          value: ethers.parseEther('0.0003'),
        });

      await transaction.wait();

      toast('Deposit paied successfully!');
      await refetch();
    } catch (err: any) {
      console.log(err);
      toast(err.reason ?? 'Something went wrong', { type: 'error' });
    }

    return null;
  }, [account, marketplace, marketplaceData.nftId, refetch]);

  const handlePayProperty = useCallback(async () => {
    if (account == null) {
      return toast('You need to connect an account!', { type: 'error' });
    }

    if (marketplace == null) {
      return toast('Something went wrong!', { type: 'error' });
    }
    try {
      // TODO: MAKE SURE PRICE IS CORRECT AND ALWAYS IN WEI

      const transaction = await marketplace
        .connect(account)
        .payTransaction(marketplaceData.nftId, {
          value: marketplaceData.price.toString(),
        });

      await transaction.wait();

      toast('Property paied successfully!');
      await refetch();
    } catch (err: any) {
      console.log(err);
      toast(err.reason ?? 'Something went wrong', { type: 'error' });
    }

    return null;
  }, [
    account,
    marketplace,
    marketplaceData.nftId,
    marketplaceData.price,
    refetch,
  ]);

  const handleApproveTransaction = useCallback(async () => {
    if (account == null) {
      return toast('You need to connect an account!', { type: 'error' });
    }

    if (marketplace == null) {
      return toast('Something went wrong!', { type: 'error' });
    }

    try {
      const transaction = await marketplace
        .connect(account)
        .approve(marketplaceData.nftId);

      await transaction.wait();

      toast('Property approved successfully!');
      await refetch();
    } catch (err: any) {
      console.log(err);
      toast(err.reason ?? 'Something went wrong', { type: 'error' });
    }

    return null;
  }, [account, marketplace, marketplaceData.nftId, refetch]);

  const handleFinalizeTransaction = useCallback(async () => {
    if (account == null) {
      return toast('You need to connect an account!', { type: 'error' });
    }

    if (marketplace == null) {
      return toast('Something went wrong!', { type: 'error' });
    }

    try {
      const transaction = await marketplace
        .connect(account)
        .finalizeTransaction(marketplaceData.nftId);

      await transaction.wait();

      toast('Transaction finalized successfully');
      await refetch();
    } catch (err: any) {
      console.log(err);
      toast(err.reason ?? 'Something went wrong', { type: 'error' });
    }

    return null;
  }, [account, marketplace, marketplaceData.nftId, refetch]);

  const actionButton = useMemo(() => {
    if (!account) {
      return {
        title: 'Buy',
        onClick: () => {
          toast('You need to connect an account!', { type: 'info' });
        },
      };
    }
    if (account.address === marketplaceData.seller) {
      if (escrowProps?.approvals.every((yes) => yes)) {
        return {
          title: 'Finalize transaction',
          onClick: handleFinalizeTransaction,
          color: 'secondary',
        };
      }

      if (
        marketplaceData.buyer !== '0x0000000000000000000000000000000000000000'
      ) {
        let title = '';
        if (escrowProps?.state === BigInt(1)) {
          title = 'Wait for final payment';
        } else if (escrowProps?.state === BigInt(2)) {
          title = 'Wait for approval';
        } else {
          title = 'Wait for deposit';
        }

        return {
          title,
          onClick: undefined,
          color: 'success',
          isDisabled: true,
        };
      }

      return {
        title: 'View Buy Offers',
        onClick: onOpen,
        color: 'secondary',
      };
    }
    if (account.address === marketplaceData.buyer) {
      if (escrowProps?.approvals.every((entry) => entry)) {
        return {
          title: 'Wait for seller to finalize',
          onClick: undefined,
          color: 'success',
          isDisabled: true,
        };
      }

      if (escrowProps?.state === BigInt(1)) {
        return {
          title: 'Pay property',
          onClick: handlePayProperty,
          color: 'success',
        };
      }

      if (escrowProps?.state === BigInt(2)) {
        return {
          title: 'Approve transaction',
          onClick: handleApproveTransaction,
          color: 'success',
        };
      }

      return {
        title: 'Pay deposit',
        onClick: handlePayDeposit,
        color: 'secondary',
      };
    }
    if (marketplaceData.buyers.includes(account.address)) {
      return {
        title: "Wait for seller's approval",
        onClick: undefined,
        isDisabled: true,
        color: 'success',
      };
    }

    return { title: 'Buy', onClick: handleBuyOffer, color: 'primary' };
  }, [
    account,
    marketplaceData.seller,
    marketplaceData.buyer,
    marketplaceData.buyers,
    handleBuyOffer,
    onOpen,
    escrowProps,
    handlePayDeposit,
    handlePayProperty,
    handleApproveTransaction,
    handleFinalizeTransaction,
  ]);

  const handlePressProperty = () => {
    window.open(marketplaceData.nftURI, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card shadow="sm" isPressable onPress={handlePressProperty}>
      <CardBody className="overflow-visible p-0">
        <Image
          shadow="sm"
          radius="none"
          width={aspectRatio.x * scale}
          height={aspectRatio.y * scale}
          alt={property.description}
          className="h-72 w-full object-cover"
          src={property.image.replace('ipfs://', IPFS_GATEWAY)}
        />
        {isDashboard ? null : account?.address === marketplaceData.seller ? (
          <Chip
            color="success"
            size="sm"
            variant="shadow"
            className="absolute right-3 top-3 z-50"
          >
            <p className="text-sm font-light text-white">Owned</p>
          </Chip>
        ) : account?.address === marketplaceData.buyer ? (
          <Chip
            color="success"
            size="sm"
            variant="shadow"
            className="absolute right-3 top-3 z-50"
          >
            <p className="text-sm font-medium text-white">Buying proccess...</p>
          </Chip>
        ) : null}
      </CardBody>
      <CardFooter className="max-w-[420px] flex-col items-start gap-1">
        <p className="mb-3 flex items-center text-2xl font-bold">
          {ethers.formatEther(property.price?.toString() ?? '0')}
          <FaEthereum /> ETH
        </p>
        <p className="text-medium font-semibold">
          {property.propertyaddress} {property.city}
        </p>
        <p className="text-start text-sm text-gray-500">
          {property.description}
        </p>

        <div className="mt-6 flex items-center justify-start gap-3">
          <div className="flex items-center justify-start gap-1 rounded-md bg-sky-100 p-3">
            <LuConstruction className="text-black" />
            <p className="text-sm text-black">
              Built in {property.yearofconstruction}
            </p>
          </div>
          <div className="flex items-center justify-start gap-1 rounded-md bg-orange-100 p-3">
            <LuRuler className="text-black" />
            <p className="text-sm text-black">{property.totalarea}m2</p>
          </div>
          <div className="flex items-center justify-start gap-1 rounded-md bg-red-100 p-3">
            <LuBedDouble className="text-black" />
            <p className="text-sm text-black">{property.rooms}</p>
          </div>
          <div className="flex items-center justify-start gap-1 rounded-md bg-green-100 p-3">
            <LuBath className="text-black" />
            <p className="text-sm text-black">{property.bathrooms}</p>
          </div>
        </div>

        {isDashboard ? (
          <Button
            // @ts-ignore
            color={actionButton.color ?? 'primary'}
            className="mt-3"
            onClick={actionButton.onClick}
            isDisabled={actionButton.isDisabled}
          >
            <p className="mx-6">{actionButton.title}</p>
          </Button>
        ) : null}
      </CardFooter>
      <BuyOffersModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        nftId={marketplaceData.nftId}
        buyers={marketplaceData.buyers}
      />
    </Card>
  );
};

export default ListedPropertyItem;
