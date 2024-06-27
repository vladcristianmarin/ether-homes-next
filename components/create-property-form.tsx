import { Button, Chip, Input, Link, Spinner, Tooltip } from '@nextui-org/react';
import axios from 'axios';
import { useFormik } from 'formik';
import * as React from 'react';
import { useRef, useState } from 'react';
import { FaUpload } from 'react-icons/fa6';
import { LuUndo2 } from 'react-icons/lu';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';

import type { DocumentsUploaderController } from './documents-uploader';
import DocumentsUploader from './documents-uploader';
import type { ImageUploaderController } from './image-uploader';
import ImageUploader from './image-uploader';

interface Property {
  city: string;
  propertyAddress: string;
  rooms: string;
  bathrooms: string;
  usableArea: string;
  totalArea: string;
  yearOfConstruction: string;
  documentsUris: string[];
  imagesUris: string[];
}

const PropertySchema = Yup.object({
  city: Yup.string().required('City is required'),
  propertyAddress: Yup.string().required('Property address is required'),
  rooms: Yup.number()
    .typeError('Rooms must be a number')
    .positive('Rooms must be a positive number')
    .required('Rooms are required'),
  bathrooms: Yup.number()
    .typeError('Bathrooms must be a number')
    .positive('Bathrooms must be a positive number')
    .required('Bathrooms are required'),
  usableArea: Yup.number()
    .typeError('Usable area must be a number')
    .positive('Usable area must be a positive number')
    .required('Usable area is required'),
  totalArea: Yup.number()
    .typeError('Total area must be a number')
    .positive('Total area must be a positive number')
    .required('Total area is required'),
  yearOfConstruction: Yup.number()
    .typeError('Year of construction must be a number')
    .integer('Year of construction must be an integer')
    .required('Year of construction is required'),
  documentsUris: Yup.array()
    .of(
      Yup.string().matches(
        /^[a-zA-Z]+:\/\/.+$/,
        'Each document URI must be a valid URL',
      ),
    )
    .required('Documents URIs are required')
    .test({
      message: 'Documents URIs are required',
      test: (docs) => docs.length > 0,
    }),
  imagesUris: Yup.array()
    .of(
      Yup.string().matches(
        /^[a-zA-Z]+:\/\/.+$/,
        'Each image URI must be a valid URL',
      ),
    )
    .required('Images URIs are required')
    .test({
      message: 'Images URIs are required',
      test: (images) => images.length > 0,
    }),
});

interface IMultiInputProps {
  name: 'documentsUris' | 'imagesUris';
  label: string;
  value: string;
  values: string[];
  isInvalid?: boolean;
  errorMessage?: string | string[];
  onClose?: (
    field: 'documentsUris' | 'imagesUris',
    valueToDelete: string,
  ) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> &
    ((e: KeyboardEvent) => void);
  onBlur?: React.FocusEventHandler<HTMLInputElement> &
    ((e: React.FocusEvent<Element, Element>) => void);
}

const MultiInput: React.FC<IMultiInputProps> = ({
  name,
  label,
  value,
  values,
  isInvalid,
  errorMessage,
  onClose,
  onChange,
  onKeyDown,
  onBlur,
}) => {
  return (
    <div className="flex flex-col justify-start gap-2">
      <div
        className={`${values.length === 0 && 'hidden'}
      flex flex-row flex-wrap items-center justify-start gap-2
      `}
      >
        {values.map((item, index) => (
          <Chip
            variant="bordered"
            color="primary"
            key={index}
            isCloseable
            onClose={() => onClose?.(name, item)}
          >
            <Tooltip content={item} delay={500} size="sm">
              <Link href={item} isExternal showAnchorIcon>
                {item.length > 14
                  ? `${item.slice(0, 14)}...${item.slice(item.length - 4, -1)}`
                  : item}
              </Link>
            </Tooltip>
          </Chip>
        ))}
      </div>

      <Input
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export interface ICreatePropertyFormProps {}

export function CreatePropertyForm(props: ICreatePropertyFormProps) {
  const { realEstate } = useContracts();
  const { account } = useWallet();

  const [documentsUploadLoading, setDocumentsUploadLoading] =
    useState<boolean>(false);
  const [imagesUploadLoading, setimagesUploadLoading] =
    useState<boolean>(false);

  const documentsUploaderRef = useRef<DocumentsUploaderController>(null);
  const imagesUploaderRef = useRef<ImageUploaderController>(null);

  const formik = useFormik<Property>({
    initialValues: {
      city: '',
      propertyAddress: '',
      rooms: '',
      bathrooms: '',
      usableArea: '',
      totalArea: '',
      yearOfConstruction: '',
      documentsUris: [],
      imagesUris: [],
    },
    validationSchema: PropertySchema,
    async onSubmit(values) {
      if (realEstate) {
        try {
          const transaction = await realEstate
            .connect(account)
            .createProperty(
              values.city,
              values.propertyAddress,
              values.rooms,
              values.bathrooms,
              values.usableArea,
              values.totalArea,
              values.yearOfConstruction,
              values.documentsUris,
              values.imagesUris,
            );
          const transactionResult = await transaction.wait();
          if (transactionResult?.status === 1) {
            toast('Successfully uploaded property data to blockchain', {
              type: 'success',
            });
          } else {
            toast('Something went wrong, transaction reverted', {
              type: 'error',
            });
          }
          formik.resetForm();
        } catch (e: any) {
          if (e.reason === 'rejected') {
            toast('You rejected transaction', {
              type: 'warning',
            });
          } else {
            toast('Something went wrong, transaction reverted', {
              type: 'error',
            });
            console.error(e);
          }
        }
      }
    },
  });

  const [documentUri, setDocumentUri] = useState<string>('');
  const [imageUri, setImageUri] = useState<string>('');

  const handleConfirmUri = (
    field: 'documentsUris' | 'imagesUris',
    event: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent,
  ) => {
    const value = field === 'documentsUris' ? documentUri : imageUri;

    if (event.key === 'Enter' && value.trim() !== '') {
      event.preventDefault();
      formik.setFieldValue(field, [...formik.values[field], value]).then(() => {
        field === 'documentsUris' ? setDocumentUri('') : setImageUri('');
      });
    }
  };

  const handleDeleteValue = (
    field: 'documentsUris' | 'imagesUris',
    valueToDelete: string,
  ) => {
    formik.setFieldValue(
      field,
      formik.values[field].filter((value) => value !== valueToDelete),
    );
  };

  const handleBlurUrl = (
    field: 'documentsUris' | 'imagesUris',
    e: React.FocusEvent<Element, Element>,
  ) => {
    formik.handleBlur(e);

    const value = field === 'documentsUris' ? documentUri : imageUri;

    if (value.trim()) {
      formik.setFieldValue(field, [...formik.values[field], value]).then(() => {
        field === 'documentsUris' ? setDocumentUri('') : setImageUri('');
      });
    }
  };

  const handleUploadFileIPFS = async (files: File[], type: 'doc' | 'image') => {
    const requests = files.map((file) => {
      const formData = new FormData();
      formData.append('file', file);

      return axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    });

    if (type === 'doc') {
      setDocumentsUploadLoading(true);
    } else if (type === 'image') {
      setimagesUploadLoading(true);
    }

    try {
      const response = await Promise.all(requests);

      const IPFS_URIS = response.map((response) =>
        'ipfs://'.concat(response.data.IpfsHash),
      );

      if (type === 'doc') {
        documentsUploaderRef.current?.clearFiles();
        await formik.setFieldValue('documentsUris', [
          ...formik.values.documentsUris,
          ...IPFS_URIS,
        ]);
      } else if (type === 'image') {
        imagesUploaderRef.current?.clearFiles();
        await formik.setFieldValue('imagesUris', [
          ...formik.values.imagesUris,
          ...IPFS_URIS,
        ]);
      }
    } catch (err: any) {
      console.log(err);
      toast('Something went wrong', { type: 'error' });
    } finally {
      setDocumentsUploadLoading(false);
      setimagesUploadLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex w-full flex-1 items-center justify-between">
        <h2 className="mx-2 text-medium font-semibold ">
          Upload property to blockchain
        </h2>
        <Tooltip
          content={
            formik.isSubmitting ? 'Proccessing transaction' : 'Clear form'
          }
          offset={15}
          delay={500}
        >
          <Button
            isIconOnly
            aria-label="Reset"
            variant="light"
            onPress={formik.handleReset}
            isLoading={formik.isSubmitting}
          >
            <LuUndo2 size={18} />
          </Button>
        </Tooltip>
      </div>
      <form
        className="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          console.log('submit');
          e.preventDefault();
          formik.handleSubmit(e);
        }}
      >
        <Input
          className="col-span-2"
          label="Address"
          {...formik.getFieldProps('propertyAddress')}
          isInvalid={Boolean(
            formik.touched.propertyAddress && formik.errors.propertyAddress,
          )}
          errorMessage={
            formik.touched.propertyAddress ? formik.errors.propertyAddress : ''
          }
        />
        <Input
          label="City"
          {...formik.getFieldProps('city')}
          isInvalid={Boolean(formik.touched.city && formik.errors.city)}
          errorMessage={formik.touched.city ? formik.errors.city : ''}
        />
        <Input
          label="Rooms"
          {...formik.getFieldProps('rooms')}
          type="number"
          isInvalid={Boolean(formik.touched.rooms && formik.errors.rooms)}
          errorMessage={formik.touched.rooms ? formik.errors.rooms : ''}
        />
        <Input
          label="Bathrooms"
          {...formik.getFieldProps('bathrooms')}
          type="number"
          isInvalid={Boolean(
            formik.touched.bathrooms && formik.errors.bathrooms,
          )}
          errorMessage={formik.touched.bathrooms ? formik.errors.bathrooms : ''}
        />
        <Input
          label="Usable Area"
          {...formik.getFieldProps('usableArea')}
          type="number"
          isInvalid={Boolean(
            formik.touched.usableArea && formik.errors.usableArea,
          )}
          errorMessage={
            formik.touched.usableArea ? formik.errors.usableArea : ''
          }
        />
        <Input
          label="Total Area"
          {...formik.getFieldProps('totalArea')}
          type="number"
          isInvalid={Boolean(
            formik.touched.totalArea && formik.errors.totalArea,
          )}
          errorMessage={formik.touched.totalArea ? formik.errors.totalArea : ''}
        />
        <Input
          label="Year of construction"
          {...formik.getFieldProps('yearOfConstruction')}
          type="number"
          isInvalid={Boolean(
            formik.touched.yearOfConstruction &&
              formik.errors.yearOfConstruction,
          )}
          errorMessage={
            formik.touched.yearOfConstruction
              ? formik.errors.yearOfConstruction
              : ''
          }
        />
        <div className="col-span-2">
          <MultiInput
            name="documentsUris"
            label="Documents URI(s)"
            value={documentUri}
            values={formik.values.documentsUris}
            isInvalid={Boolean(
              formik.touched.documentsUris && formik.errors.documentsUris,
            )}
            errorMessage={
              formik.touched.documentsUris ? formik.errors.documentsUris : ''
            }
            onChange={(e) => setDocumentUri(e.target.value)}
            onKeyDown={(e) => handleConfirmUri('documentsUris', e)}
            onBlur={(e) => handleBlurUrl('documentsUris', e)}
            onClose={handleDeleteValue}
          />
          <DocumentsUploader
            isLoading={documentsUploadLoading}
            ref={documentsUploaderRef}
            onUploadFiles={handleUploadFileIPFS}
          />
        </div>
        <div className="col-span-2">
          <MultiInput
            name="imagesUris"
            label="Images URI(s)"
            value={imageUri}
            values={formik.values.imagesUris}
            isInvalid={Boolean(
              formik.touched.imagesUris && formik.errors.imagesUris,
            )}
            errorMessage={
              formik.touched.imagesUris ? formik.errors.imagesUris : ''
            }
            onChange={(e) => setImageUri(e.target.value)}
            onKeyDown={(e) => handleConfirmUri('imagesUris', e)}
            onBlur={(e) => handleBlurUrl('imagesUris', e)}
            onClose={handleDeleteValue}
          />
          <ImageUploader
            isLoading={imagesUploadLoading}
            ref={imagesUploaderRef}
            onUploadFiles={handleUploadFileIPFS}
          />
        </div>

        <Button
          type="submit"
          className="col-span-2"
          color="primary"
          endContent={
            formik.isSubmitting ? (
              <Spinner size="sm" color="white" />
            ) : (
              <FaUpload />
            )
          }
        >
          {formik.isSubmitting ? 'Proccessing...' : 'Upload'}
        </Button>
      </form>
    </div>
  );
}
