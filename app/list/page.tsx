'use client';

import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Link } from '@nextui-org/link';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import axios from 'axios';
import {
  BrowserProvider,
  Contract,
  type JsonRpcSigner,
  type TransactionReceipt,
  type TransactionResponse,
} from 'ethers';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import { LuExternalLink } from 'react-icons/lu';
import { toast } from 'react-toastify';

import RealEstateAbi from '@/abis/RealEstate.json';
import DocumentsUploader from '@/components/documents-uploader';
import ImageUploader from '@/components/image-uploader';
import type { RealEstate } from '@/typechain-types';

const ListPropertyPage = () => {
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();

  const [realEstate, setRealEstate] = useState<RealEstate>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const [ownedTokens, setOwnedTokens] = useState<string[]>([]);
  const [refetchOwnedTokens, setRefetchOwnedTokens] = useState<boolean>(true);

  const [image, setImage] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

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
    address: string;
    year: string;
    surface: number;
    totalSurface: number;
    floor: number | null;
    nbRooms: number;
    nbBedrooms: number;
    nbBathrooms: number;
  }>({
    initialValues: {
      name: '',
      description: '',
      address: '',
      year: '',
      surface: 0,
      totalSurface: 0,
      floor: null,
      nbRooms: 0,
      nbBedrooms: 0,
      nbBathrooms: 0,
    },
    onSubmit: async (values) => {
      if (image == null || documents.length === 0) {
        toast('Please upload image and/or documents', { type: 'error' });
        return;
      }

      const [photoHash, ...documentsHash] = await uploadFilesToIpfs([
        image,
        ...documents,
      ]);

      const json = JSON.stringify({
        name: values.name,
        description: values.description,
        image: `ipfs://${photoHash}`,
        attributes: [
          { trait_type: 'address', value: values.address },
          { display_type: 'number', trait_type: 'Year', value: values.year },
          {
            display_type: 'number',
            trait_type: 'Surface',
            value: values.surface,
          },
          {
            display_type: 'number',
            trait_type: 'TotalSurface',
            value: values.totalSurface,
          },
          {
            display_type: 'number',
            trait_type: 'TotalSurface',
            value: values.totalSurface,
          },
          { display_type: 'number', trait_type: 'Floor', value: values.floor },
          {
            display_type: 'number',
            trait_type: 'Nb of rooms',
            value: values.nbRooms,
          },
          {
            display_type: 'number',
            trait_type: 'Nb of bedrooms',
            value: values.nbBedrooms,
          },
          {
            display_type: 'number',
            trait_type: 'Nb of bathrooms',
            value: values.nbBathrooms,
          },
          ...documentsHash.map((docHash) => ({
            display_type: 'url',
            trait_type: 'Document',
            value: `ipfs://${docHash}`,
          })),
        ],
      });

      try {
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

        formik.resetForm();

        if (realEstate) {
          const transaction: TransactionResponse =
            await realEstate.createTokenURI(`ipfs://${ipfsHash}`);
          const transactionResult: TransactionReceipt | null =
            await transaction.wait();

          if (transactionResult) {
            setRefetchOwnedTokens(true);
            toast(`Real estate NFT deploy to ${transactionResult.to}`, {
              type: 'success',
            });
          }
        }
      } catch (err: any) {
        toast(`Something went wrong ${err?.message ?? err}`, { type: 'error' });
        console.error(err);
      }
    },
  });

  useEffect(() => {
    const setContract = async () => {
      const provider = new BrowserProvider(walletProvider!);
      const localSigner = await provider.getSigner(address);

      setSigner(localSigner);

      // @ts-expect-error
      const realEstateContract: RealEstate = new Contract(
        RealEstateAbi.address,
        RealEstateAbi.abi,
        localSigner,
      );

      if (realEstateContract) {
        setRealEstate(realEstateContract);
      }
    };

    if (walletProvider != null && address != null) {
      setContract().then(() => {
        toast(`Realestate contract created`, {
          type: 'success',
          hideProgressBar: true,
          autoClose: 500,
        });
      });
    }
  }, [address, walletProvider]);

  useEffect(() => {
    const getOwnedTokens = async () => {
      if (realEstate && signer) {
        const tokens = await realEstate.getOwnedTokens(signer);
        const tokenURIs = await Promise.all(
          tokens.map((token) => realEstate.tokenURI(token)),
        );
        setOwnedTokens(tokenURIs);
        setRefetchOwnedTokens(false);
      }
    };

    if (refetchOwnedTokens && realEstate && signer) {
      getOwnedTokens().then();
    }
  }, [realEstate, refetchOwnedTokens, signer]);

  return (
    <div className="flex flex-row items-start justify-center gap-10">
      <div className="flex basis-[45%] border-spacing-2 flex-col gap-2 rounded-md border-1 border-neutral-400 p-2">
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

      <div className="flex basis-[55%] border-spacing-2 flex-col gap-2 rounded-md border-1 border-neutral-400 p-2">
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
            name="address"
            label="Address"
            type="string"
            required
            isRequired
            value={formik.values.address}
            onChange={formik.handleChange}
          />
          <Input
            name="year"
            label="Year built"
            type="string"
            required
            isRequired
            value={formik.values.year}
            onChange={formik.handleChange}
          />
          <Input
            name="surface"
            label="Surface (m2)"
            type="number"
            required
            isRequired
            value={formik.values.surface.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="totalSurface"
            label="Total surface (m2)"
            type="number"
            required
            isRequired
            value={formik.values.totalSurface.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="floor"
            label="Floor"
            type="number"
            required
            isRequired
            value={formik.values.floor?.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="nbRooms"
            label="Nb of rooms"
            type="number"
            required
            isRequired
            value={formik.values.nbRooms.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="nbBedrooms"
            label="Nb of bedrooms"
            type="number"
            value={formik.values.nbBedrooms.toString()}
            onChange={formik.handleChange}
          />
          <Input
            name="nbBathrooms"
            label="Nb of bathrooms"
            type="number"
            value={formik.values.nbBathrooms.toString()}
            onChange={formik.handleChange}
          />
          <div className="col-span-2">
            <p className="mb-2 ml-2 text-sm text-gray-700">Upload NFT image</p>
            <ImageUploader onAcceptedFiles={(photos) => setImage(photos[0])} />
          </div>
          <div className="col-span-2">
            <p className="mb-2 ml-2 text-sm text-gray-700">
              Upload property documents
            </p>
            <DocumentsUploader
              onAcceptedFiles={(documents) => setDocuments(documents)}
            />
          </div>
          <Button className="col-span-2" type="submit" color="primary">
            Create
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ListPropertyPage;
