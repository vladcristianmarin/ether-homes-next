import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Image,
  useDisclosure,
} from '@nextui-org/react';
import { useCallback, useMemo } from 'react';
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
}

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const aspectRatio = { x: 16, y: 9 };
const scale = 30;

const ListedPropertyItem: React.FC<IListedPropertyItemProps> = ({
  property,
  marketplaceData,
}) => {
  const { isOpen, onOpenChange, onOpen } = useDisclosure();

  const { account } = useWallet();
  const { marketplace } = useContracts();

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
    } catch (err: any) {
      toast('Something went wrong', { type: 'error' });
    }

    return null;
  }, [account, marketplace, marketplaceData.nftId]);

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
      if (marketplaceData.buyer != null) {
        return {
          title: 'Wait for deposit',
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
      return { title: 'Pay deposit', onClick: () => {}, color: 'secondary' };
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
    handleBuyOffer,
    marketplaceData.buyer,
    marketplaceData.buyers,
    marketplaceData.seller,
    onOpen,
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
      </CardBody>
      <CardFooter className="max-w-[420px] flex-col items-start gap-1">
        <p className="mb-3 flex items-center text-2xl font-bold">
          {property.price} <FaEthereum /> ETH
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

        <Button
          // @ts-ignore
          color={actionButton.color ?? 'primary'}
          className="mt-3"
          onClick={actionButton.onClick}
          isDisabled={actionButton.isDisabled}
        >
          <p className="mx-6">{actionButton.title}</p>
        </Button>
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
