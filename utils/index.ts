/* eslint-disable no-prototype-builtins */

import type { BigNumberish } from 'ethers';
import moment from 'moment';

import type { RealEstate } from '@/typechain-types';

export function bigNumberToDate(bigN: BigNumberish) {
  return moment(Number(bigN.toString()) * 1000).format('DD.MM.YYYY HH:mm');
}

export function bigNumberToNumber(bigN: BigNumberish) {
  return Number(bigN.toString());
}

export const createPropertyJSON = (property: RealEstate.PropertyStruct) => {
  const attributes = [
    { trait_type: 'City', value: property.city },
    { trait_type: 'Property Address', value: property.propertAddress },
    { trait_type: 'Rooms', value: bigNumberToNumber(property.rooms) },
    { trait_type: 'Bathrooms', value: bigNumberToNumber(property.bathrooms) },
    {
      trait_type: 'Usable Area',
      value: bigNumberToNumber(property.usableArea),
    },
    { trait_type: 'Total Area', value: bigNumberToNumber(property.totalArea) },
    {
      trait_type: 'Year of Construction',
      value: bigNumberToNumber(property.yearOfConstruction),
    },
    {
      trait_type: 'Documents URIs',
      value: property.documentsUris,
    },
    {
      trait_type: 'Images URIs',
      value: property.imagesUris,
    },
  ];

  const propertyJSON = JSON.stringify({
    name: `${property.propertAddress} ${property.city} ${property.yearOfConstruction}`,
    description: `Property in ${property.city}, ${property.propertAddress} built in ${property.yearOfConstruction}, having ${property.rooms} rooms and ${property.bathrooms} bathrooms, and an area of ${property.totalArea}m2.`,
    image: property.imagesUris[0],
    attributes,
  });

  return propertyJSON;
};
