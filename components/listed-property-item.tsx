import { Button, Card, CardBody, CardFooter, Image } from '@nextui-org/react';
import { FaEthereum } from 'react-icons/fa6';
import { LuBath, LuBedDouble, LuConstruction, LuRuler } from 'react-icons/lu';

import type { SimplifiedTokenizedProperty } from '@/models/TokenizedProperty';

interface IListedPropertyItemProps {
  property: SimplifiedTokenizedProperty;
}

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const aspectRatio = { x: 16, y: 9 };
const scale = 30;

const ListedPropertyItem: React.FC<IListedPropertyItemProps> = ({
  property,
}) => {
  return (
    <Card shadow="sm" isPressable>
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

        <Button color="primary" className="mt-3">
          <p className="mx-6">Buy</p>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ListedPropertyItem;
