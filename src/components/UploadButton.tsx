'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { DialogTrigger, Dialog, DialogContent } from './ui/dialog'
import Dropzone from 'react-dropzone'
import { Cloud, File, Loader2 } from 'lucide-react'
import { Progress } from './ui/progress'
import { useUploadThing } from '@/utils/uploadthing'
import { generateClientDropzoneAccept } from 'uploadthing/client'
import { useToast } from './ui/use-toast'
import { ToastAction } from './ui/toast'
import { trpc } from '@/utils/trpc'
import { useRouter } from 'next/navigation'

const UploadDropzone = () => {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const { mutateAsync: startPolling } = trpc.getFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file.id}`)
    },
    onSettled: () => {
      setIsUploading(false)
    },
    // exponential backoff
    retry: uploadProgress === 100 ? false : true,
    retryDelay: 500,
  })
  const { toast } = useToast()
  const { startUpload, permittedFileInfo } = useUploadThing(
    'pdfUploader',
    {
      onClientUploadComplete: () => {
        toast({
          title: 'onClientUploadComplete',
          value: 'complete upload file',
          action: <ToastAction altText="Try again">ok</ToastAction>
        })
      },
      onUploadError: () => {
        alert("error occurred while uploading");
        toast({
          title: 'onUploadError',
          variant: 'destructive',
          value: 'error occurred while uploading',
          action: <ToastAction altText="Try again">try again</ToastAction>
        })
      },
      onUploadBegin: () => {
        toast({
          title: 'onUploadBegin',
          value: 'upload has begun',
          action: <ToastAction altText="Try again">ok</ToastAction>
        })
      },
    }
  )
  const startSimulatedProgress = () => {
    setUploadProgress(0)
    const interVal = setInterval(() => {
      setUploadProgress(pre => {
        if (uploadProgress >= 95) {
          clearInterval(interVal)
          return pre
        } else {
          return pre + 5
        }
      })
    }, 500)
    return interVal
  }
  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo?.config)
    : [];
  const uploadAcceptType = fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined
  return (
    <Dropzone
      accept={uploadAcceptType}
      multiple={false}
      onDrop={async (file) => {
        setIsUploading(true)
        const progressInterval = startSimulatedProgress()
        const result = await startUpload(file)
        if (!result || !result[0].key) {
          return toast({
            title: 'some thing went wrong',
            variant: 'destructive',
            value: 'please try a again latter',
          })
        }
        clearInterval(progressInterval)
        setUploadProgress(100)
        startPolling({ key: result[0].key })
      }}>
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'>
          <div className='flex items-center justify-center h-full w-full'>
            <label
              htmlFor='dropzone-file'
              className='flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <Cloud className='h-6 w-6 text-zinc-500 mb-2' />
                <p className='mb-2 text-sm text-zinc-700'>
                  <span className='font-semibold'>
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className='text-xs text-zinc-500'>
                  {/* PDF (up to {isSubscribed ? "16" : "4"}MB) */}
                  PDF (up to 4 MB)
                </p>
              </div>
              {acceptedFiles && acceptedFiles[0] ? (
                <div className='max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                  <div className='px-3 py-2 h-full grid place-items-center'>
                    <File className='h-4 w-4 text-blue-500' />
                  </div>
                  <div className='px-3 py-2 h-full text-sm truncate'>
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}
              {isUploading ? (
                <div className='w-full mt-4 max-w-xs mx-auto'>
                  <Progress
                    value={uploadProgress}
                    className='h-1 w-full bg-zinc-200'
                    indicateColor={uploadProgress === 100 ? 'bg-green-500' : ''}
                  />
                  {uploadProgress === 100 && (
                    <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Redirecting...
                    </div>
                  )}
                </div>
              ) : null}
              <input
                {...getInputProps()}
                type='file'
                id='dropzone-file'
                className='hidden'
              />
            </label>
          </div>
        </div>
      )
      }
    </Dropzone >
  )
}
export const UploadButton = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v)
        }
      }}>
      <DialogTrigger
        onClick={() => setIsOpen(true)}
        asChild>
        <Button >Upload PDF</Button>
      </DialogTrigger>

      <DialogContent>
        <UploadDropzone />
        {/* <UploadDropzone isSubscribed={isSubscribed} /> */}
      </DialogContent>
    </Dialog>
  )
}