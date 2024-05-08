'use client';

import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Link } from '@nextui-org/link';
import { Progress } from '@nextui-org/progress';
import axios from 'axios';
import { useFormik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import { LuClipboardCopy, LuExternalLink } from 'react-icons/lu';
import { toast } from 'react-toastify';

import type { DocumentsUploaderController } from '@/components/documents-uploader';
import DocumentsUploader from '@/components/documents-uploader';
import type { ImageUploaderController } from '@/components/image-uploader';
import ImageUploader from '@/components/image-uploader';
import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import { mapObjectToIpfsAttribute } from '@/utils';

const ListPropertyPage = () => {
  const [ownedTokens, setOwnedTokens] = useState<string[]>([]);
  const [refetchOwnedTokens, setRefetchOwnedTokens] = useState<boolean>(true);

  const [image, setImage] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProccessing, setIsProccessing] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<string>('');

  const imageUploaderRef = useRef<ImageUploaderController>(null);
  const documentsUploaderRef = useRef<DocumentsUploaderController>(null);

  const { account } = useWallet();
  const { realEstate, realEstateAddress } = useContracts();

  const uploadFilesToIpfs = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        },
      );

      return response.data;
    });

    const results = await Promise.all(uploadPromises);

    return results.map((result) => result.IpfsHash);
  };

  const formik = useFormik<{
    name: string;
    description: string;
    city: string;
    propertyAddress: string;
    rooms: number;
    bathrooms: number;
    usableArea: number;
    totalArea: number;
    yearOfConstruction: number;
  }>({
    initialValues: {
      name: '',
      description: '',
      city: '',
      propertyAddress: '',
      rooms: 0,
      bathrooms: 0,
      usableArea: 0,
      totalArea: 0,
      yearOfConstruction: 0,
    },
    onSubmit: async ({ name, description, ...propertyValues }) => {
      if (image == null || documents.length === 0) {
        toast('Please upload image and/or documents', { type: 'error' });
        return;
      }

      try {
        setIsLoading(true);

        setStatusMessage('Uploading photo and documents to IPFS');

        const [photoHash, ...documentsHash] = await uploadFilesToIpfs([
          image,
          ...documents,
        ]);

        setStatusMessage('Creating property...');

        if (realEstate != null && account != null) {
          const transaction = await realEstate
            .connect(account)
            .createProperty(
              propertyValues.city,
              propertyValues.propertyAddress,
              propertyValues.rooms,
              propertyValues.bathrooms,
              propertyValues.usableArea,
              propertyValues.totalArea,
              propertyValues.yearOfConstruction,
            );

          setIsProccessing(true);

          setStatusMessage('Creating property NFT...');

          await transaction.wait();

          try {
            const filter = await realEstate.filters['PropertyCreated(uint256)'];

            const propertyId = (await realEstate.queryFilter(filter))[0]
              .args[0];

            const property = await realEstate
              .connect(account)
              .getOwnedPropertyById(propertyId);

            if (property) {
              const json = JSON.stringify({
                name,
                description,
                image: `ipfs://${photoHash}`,
                ...mapObjectToIpfsAttribute(propertyValues),
                ...documentsHash.map((docHash) => ({
                  display_type: 'url',
                  trait_type: 'propertyDocument',
                  value: `ipfs://${docHash}`,
                })),
              });

              setStatusMessage('Uploading property JSON to IPFS...');

              const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                json,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
                    'Content-Type': 'application/json',
                  },
                },
              );

              const ipfsHash: string = response.data.IpfsHash;

              const transaction = await realEstate.createTokenURI(
                `ipfs://${ipfsHash}`,
                propertyId,
              );

              const transactionResult = await transaction.wait();

              setIsProccessing(false);

              if (transactionResult) {
                setRefetchOwnedTokens(true);
                toast(`Real estate NFT deploy to ${transactionResult.to}`, {
                  type: 'success',
                });
              }
            }
          } catch (err: any) {
            toast(`Something went wrong ${err?.message ?? err}`, {
              type: 'error',
            });
            console.error(err);
            setIsLoading(false);
            setIsProccessing(false);
          }
        }
      } catch (err: any) {
        toast(`Something went wrong ${err?.message ?? err}`, { type: 'error' });
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsProccessing(false);
      }
    },
  });

  useEffect(() => {
    const getOwnedTokens = async () => {
      if (realEstate && account) {
        try {
          const tokens = await realEstate.getOwnedTokens(account);

          console.log(tokens);

          const tokenURIs = await Promise.all(
            tokens.map((token) => realEstate.tokenURI(token)),
          );
          setOwnedTokens(tokenURIs);
          setRefetchOwnedTokens(false);
        } catch (e) {
          console.error(e);
        }
      }
    };

    if (refetchOwnedTokens && realEstate && account) {
      getOwnedTokens().then();
    }
  }, [realEstate, refetchOwnedTokens, account]);

  useEffect(() => {
    setRefetchOwnedTokens(true);
  }, [account]);

  const copyAddressHandler = () => {
    if (realEstateAddress) {
      navigator.clipboard.writeText(realEstateAddress);
      toast(`${realEstateAddress} copied to clipboard!`, {
        type: 'success',
        autoClose: 500,
        hideProgressBar: true,
      });
    }
  };

  return (
    <div className="mb-24 flex flex-row items-start justify-center gap-10">
      <div className="flex basis-[45%] flex-col items-start gap-3">
        <div className="flex w-full flex-1 border-spacing-2 flex-col gap-2 rounded-md border-1 border-neutral-400 p-2">
          <h2 className="text-lg font-semibold">Your properties</h2>
          <ul className="flex flex-col gap-3">
            {ownedTokens.length === 0 ? (
              <li>Your don&apos;t have any property</li>
            ) : (
              ownedTokens.map((token) => {
                return (
                  <Link key={token} color="foreground" href={`${token}`}>
                    <div className="flex w-full items-center gap-2">
                      <p>{token}</p>
                      <LuExternalLink className="ml-auto" />
                    </div>
                  </Link>
                );
              })
            )}
          </ul>
        </div>
        <Button
          type="button"
          color="success"
          variant="shadow"
          size="md"
          endContent={<LuClipboardCopy className="text-lg text-white" />}
          onClick={copyAddressHandler}
        >
          <p className="text-medium text-white">
            Copy ReSTATE address to clipboard
          </p>
        </Button>
      </div>

      <div className="flex basis-[55%] border-spacing-2 flex-col gap-2 rounded-md border-1 border-neutral-400 p-2">
        {isLoading || isProccessing ? (
          <div className="flex flex-col items-center gap-2">
            <p
              className={`${isLoading ? 'text-green-600' : 'text-green-700'} text-lg font-semibold italic`}
            >
              {statusMessage}
            </p>
            <Progress
              color="success"
              size="sm"
              isIndeterminate
              aria-label={statusMessage}
            />
          </div>
        ) : null}

        <h2 className="text-lg font-semibold">Create property NFT</h2>
        <form
          className="grid grid-cols-2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            formik.handleSubmit(e);
          }}
        >
          <Input
            name="name"
            label="Property Name"
            type="string"
            required
            isRequired
            value={formik.values.name}
            onChange={formik.handleChange}
          />
          <Input
            name="description"
            label="Property description"
            type="string"
            required
            isRequired
            value={formik.values.description}
            onChange={formik.handleChange}
          />
          <Input
            name="propertyAddress"
            label="Address"
            type="string"
            required
            isRequired
            value={formik.values.propertyAddress}
            onChange={formik.handleChange}
          />
          <Input
            name="rooms"
            label="Number of rooms"
            type="number"
            required
            isRequired
            value={formik.values.rooms.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="bathrooms"
            label="Number of bathrooms"
            type="number"
            required
            isRequired
            value={formik.values.bathrooms.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="usableArea"
            label="Usable area (m2)"
            type="number"
            required
            isRequired
            value={formik.values.usableArea.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="totalArea"
            label="Total area (m2)"
            type="number"
            required
            isRequired
            value={formik.values.totalArea.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="yearOfConstruction"
            label="Year of construction"
            type="number"
            required
            isRequired
            value={formik.values.yearOfConstruction.toString()}
            onChange={formik.handleChange}
          />

          <div className="col-span-2">
            <p className="mb-2 ml-2 text-sm text-gray-700">Upload NFT image</p>
            <ImageUploader
              ref={imageUploaderRef}
              onAcceptedFiles={(photos) => setImage(photos[0])}
            />
          </div>
          <div className="col-span-2">
            <p className="mb-2 ml-2 text-sm text-gray-700">
              Upload property documents
            </p>
            <DocumentsUploader
              ref={documentsUploaderRef}
              onAcceptedFiles={(documents) => setDocuments(documents)}
            />
          </div>
          <Button
            className="col-span-2"
            type="submit"
            color="primary"
            isLoading={isLoading}
            isDisabled={isLoading || isProccessing}
          >
            Create
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ListPropertyPage;
