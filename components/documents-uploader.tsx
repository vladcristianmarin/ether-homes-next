import { Button } from '@nextui-org/button';
import type React from 'react';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFilePdf } from 'react-icons/fa';

interface DocumentsUploaderProps {
  isLoading?: boolean;
  onUploadFiles: (files: File[], type: 'doc' | 'image') => void | Promise<void>;
}

export interface DocumentsUploaderController {
  clearFiles: () => void;
}

const DocumentsUploader = forwardRef<
  DocumentsUploaderController,
  DocumentsUploaderProps
>(function DocumentsUploader({ isLoading, onUploadFiles }, ref) {
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
    accept: { 'application/pdf': ['.pdf'] },
  });

  return (
    <div {...getRootProps()} className="border border-dashed border-gray-300">
      <div className="flex size-full items-center justify-center">
        <label
          htmlFor="dropzone-file"
          className="flex size-full cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 px-10 hover:bg-gray-100"
        >
          <div className="flex flex-row items-center justify-center gap-2 pb-3 pt-2">
            <FaFilePdf />
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">Click to upload PDF&apos;s</span>{' '}
              or drag and drop
            </p>
          </div>

          {acceptedFiles && acceptedFiles[0] ? (
            <div className="mb-2 flex max-w-xs flex-col items-center rounded-md bg-white outline outline-1 outline-zinc-200">
              {acceptedFiles.map((file, index) => (
                <div
                  key={index}
                  className="size-full truncate border-b-1 border-gray-200 px-3 py-2 text-sm "
                >
                  {file.name}
                </div>
              ))}
            </div>
          ) : null}

          {acceptedFiles?.length > 0 ? (
            <Button
              color="primary"
              className=" mb-2"
              size="sm"
              fullWidth
              onClick={() => {
                onUploadFiles(acceptedFiles, 'doc');
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
});

export default DocumentsUploader;
