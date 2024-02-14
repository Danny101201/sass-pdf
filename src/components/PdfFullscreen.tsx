'use client'
import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Expand, Loader2 } from 'lucide-react'
import { url } from 'inspector'
import { Document, Page } from 'react-pdf';
import SimpleBar from 'simplebar-react'
import { toast, useToast } from './ui/use-toast'
import { useResizeDetector } from 'react-resize-detector'

interface PdfFullscreenProps {
  fileURL: string
}
export const PdfFullscreen = ({ fileURL }: PdfFullscreenProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [numPages, setNumPages] = useState<number>(0)
  const { width, height, ref: targetRef } = useResizeDetector();
  const { toast } = useToast()
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(v)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setOpen(pre => !pre)
          }}
          variant='ghost'
          aria-label='rotate 90 degrees'>
          <Expand className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='w-full max-w-7xl '>
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)] mt-5'>

          <div ref={targetRef} >
            <Document
              file={fileURL}
              loading={
                <div className='flex justify-center'>
                  <Loader2 className='my-24 h-6 w-6 animate-spin' />
                </div>
              }
              className='max-h-full'
              onLoadError={() => {
                toast({
                  title: 'Error loading PDF',
                  description: 'Please try again later',
                  variant: 'destructive',
                })
              }}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages)
              }}
            >
              {new Array(numPages).fill(0).map((num, index) => (
                <Page
                  key={index}
                  // width={width ? width : 1}
                  pageNumber={index + 1}
                />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  )
}
