import { Button } from '@nextui-org/button';
import type React from 'react';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdAddPhotoAlternate } from 'react-icons/md';

interface ImageUploaderProps {
  isLoading?: boolean;
  onUploadFiles: (files: File[], type: 'doc' | 'image') => void | Promise<void>;
}

export interface ImageUploaderController {
  clearFiles: () => void;
}

const ImageUploader = forwardRef<ImageUploaderController, ImageUploaderProps>(
  function DocumentsUploader({ isLoading, onUploadFiles }, ref) {
    const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);

    useImperativeHandle(
      ref,
      () => {
        return {
          clearFiles: () => setAcceptedFiles([]),
        };
      },
      [],
    );
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      setAcceptedFiles(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: {
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
      },
    });

    return (
      <div {...getRootProps()} className="border border-dashed border-gray-300">
        <div className="flex size-full items-center justify-center">
          <label
            htmlFor="dropzone-file"
            className="flex size-full cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 px-10 hover:bg-gray-100"
          >
            <div className="flex flex-row items-center justify-center gap-2 pb-3 pt-2">
              <MdAddPhotoAlternate />
              <p className="text-sm text-zinc-700">
                <span className="font-semibold">Click to upload image</span> or
                drag and drop
              </p>
            </div>

            {acceptedFiles && acceptedFiles[0] ? (
              <div className="mb-2 rounded-md bg-white outline outline-1 outline-zinc-200">
                <div className="w-full truncate border-b-1 border-gray-200 px-3 py-2 text-sm ">
                  {acceptedFiles[0].name}
                </div>
              </div>
            ) : null}

            {acceptedFiles?.length > 0 ? (
              <Button
                color="primary"
                className=" mb-2"
                size="sm"
                fullWidth
                onClick={() => {
                  onUploadFiles(acceptedFiles, 'image');
                }}
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Generate IPFS
              </Button>
            ) : null}

            <input {...getInputProps()} type="file" id="dropzone-file" />
          </label>
        </div>
      </div>
    );
  },
);

export default ImageUploader;
