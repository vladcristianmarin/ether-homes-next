import type React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdAddPhotoAlternate } from 'react-icons/md';

interface ImageUploaderProps {
  onAcceptedFiles?: (files: File[]) => void | Promise<void>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onAcceptedFiles }) => {
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setAcceptedFiles(acceptedFiles);
      onAcceptedFiles?.(acceptedFiles);
    },
    [onAcceptedFiles],
  );

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
          className="flex size-full cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100"
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

          <input {...getInputProps()} type="file" id="dropzone-file" />
        </label>
      </div>
    </div>
  );
};

export default ImageUploader;
