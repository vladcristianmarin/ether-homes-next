import { Button, Chip, Input, Tooltip } from '@nextui-org/react';
import { useFormik } from 'formik';
import * as React from 'react';
import { useState } from 'react';
import { FaUpload } from 'react-icons/fa6';
import { LuUndo2 } from 'react-icons/lu';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';

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

export interface ICreatePropertyFormProps {}

export function CreatePropertyForm(props: ICreatePropertyFormProps) {
  const { realEstate } = useContracts();
  const { account } = useWallet();

  const formik = useFormik<Property>({
    initialValues: {
      city: '',
      propertyAddress: '',
      rooms: '',
      bathrooms: '',
      usableArea: '',
      totalArea: '',
      yearOfConstruction: '',
      documentsUris: [
        'https://gray-worthwhile-hornet-806.mypinata.cloud/ipfs/QmeEz83Ewh4xTMoF4ckffyHfvQs5CqRqh4sj9SjeQGUgZn',
      ],
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
        } catch (e: any) {
          toast('Something went wrong, transaction reverted', {
            type: 'error',
          });
          console.error(e);
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
          delay={1000}
        >
          <Button
            isIconOnly
            aria-label="Reset"
            variant="flat"
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
          <div className="mb-2 flex flex-row flex-wrap items-center gap-2">
            {formik.values.documentsUris.map((item, index) => (
              <Chip
                variant="bordered"
                color="primary"
                key={index}
                isCloseable
                onClose={() => {
                  handleDeleteValue('documentsUris', item);
                }}
              >
                {item}
              </Chip>
            ))}
          </div>

          <Input
            name="documentsUris"
            label="Documents URIs"
            value={documentUri}
            onChange={(e) => setDocumentUri(e.target.value)}
            onKeyDown={(e) => handleConfirmUri('documentsUris', e)}
            onBlur={formik.handleBlur}
            isInvalid={Boolean(
              formik.touched.documentsUris && formik.errors.documentsUris,
            )}
            errorMessage={
              formik.touched.documentsUris ? formik.errors.documentsUris : ''
            }
          />
        </div>
        <div className="col-span-2">
          <div className="mb-2 flex flex-row flex-wrap items-center gap-2">
            {formik.values.imagesUris.map((item, index) => (
              <Chip
                variant="bordered"
                color="primary"
                key={index}
                isCloseable
                onClose={() => {
                  handleDeleteValue('imagesUris', item);
                }}
              >
                {item}
              </Chip>
            ))}
          </div>

          <Input
            name="imagesUris"
            label="Images URIs"
            value={imageUri}
            onChange={(e) => setImageUri(e.target.value)}
            onKeyDown={(e) => handleConfirmUri('imagesUris', e)}
            onBlur={formik.handleBlur}
            isInvalid={Boolean(
              formik.touched.imagesUris && formik.errors.imagesUris,
            )}
            errorMessage={
              formik.touched.imagesUris ? formik.errors.imagesUris : ''
            }
          />
        </div>
        <Button
          type="submit"
          className="col-span-2"
          color="primary"
          endContent={<FaUpload />}
        >
          {formik.isSubmitting ? 'Proccessing...' : 'Upload'}
        </Button>
      </form>
    </div>
  );
}
