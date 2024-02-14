'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search, History } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu'
import { useResizeDetector } from 'react-resize-detector';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useToast } from './ui/use-toast'
import { cn } from '@/lib/utils'
import { Input } from './ui/input'
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod'
import SimpleBar from 'simplebar-react';
import { PdfFullscreen } from './PdfFullscreen'
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();
interface PdfRendererProps {
  url: string
}

export const PdfRenderer = ({ url }: PdfRendererProps) => {

  const [scale, setScale] = useState<number>(1)
  const [numPages, setNumPages] = useState<number>(0)
  const [currPage, setCurrPage] = useState<number>(1)
  const [rotate, setRotate] = useState<number>(0)
  const [renderScale, setRenderScale] = useState<number | null>(null)
  const isLoading = renderScale !== scale

  const { width, height, ref: targetRef } = useResizeDetector();
  const { toast } = useToast()
  const customPageValidator = z.object({
    page: z.string()
      .refine((value) => Number(value) >= 0, { message: `page is between 0 to ${numPages}` })
  })
  type CustomPageValidator = z.infer<typeof customPageValidator>
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CustomPageValidator>({
    defaultValues: {
      page: '0'
    },
    mode: 'onChange',
    resolver: zodResolver(customPageValidator)
  })
  const handlePageSubmit: SubmitHandler<CustomPageValidator> = (data) => {
    const { page } = data
    const isExceedMaxMum = Number(page) >= numPages
    setCurrPage(isExceedMaxMum ? numPages : Number(page))
    setValue('page', isExceedMaxMum ? String(numPages) : String(page))
  }
  return (
    <div className='w-full bg-white rounded-md shadow flex flex-col items-center'>
      <div className='h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2'>
        <div className='flex items-center gap-1.5'>
          <Button
            disabled={currPage === numPages || numPages === 0}
            onClick={() => {
              setCurrPage(pre => pre + 1)
              setValue('page', String(currPage + 1))
            }}
            variant='ghost'
            aria-label='previous page'>
            <ChevronDown className='h-4 w-4' />
          </Button>
          <div className='flex items-center gap-1.5'>
            <Input
              {...register('page')}
              className={cn(
                'w-12 h-8',
                errors.page && 'focus-visible:ring-red-500'
              )}
              onKeyDown={(e) => {
                if (['e', 'E'].includes(e.key)) return e.preventDefault()
                if (e.key === 'Enter') {
                  handleSubmit(handlePageSubmit)()
                }
              }}
              onChange={e => {
                register('page').onChange(e)
                const hasNumPages = numPages > 0
                if (Number(e.target.value) <= 0) {
                  setValue('page', hasNumPages ? '1' : '0')
                }
              }}
              type='number'
            />
            <p className='text-zinc-700 text-sm space-x-1'>
              <span>/</span>
              <span>{numPages ?? 'x'}</span>
            </p>
          </div>


          <Button
            disabled={currPage <= 1 || numPages === 0}
            onClick={() => {
              setCurrPage(pre => pre - 1)
              setValue('page', String(currPage - 1))
            }}
            variant='ghost'
            aria-label='next page'>
            <ChevronUp className='h-4 w-4' />
          </Button>
        </div>

        <div className='space-x-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className='gap-1.5'
                aria-label='zoom'
                variant='ghost'>
                <Search className='h-4 w-4' />
                {scale * 100}%
                <ChevronDown className='h-3 w-3 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => setScale(1)}
              >
                100%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setScale(2)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setScale(2.5)}>
                250%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => {
              setRotate(pre => pre + 90)
            }}
            variant='ghost'
            aria-label='rotate 90 degrees'>
            <RotateCw className='h-4 w-4' />
          </Button>
          <Button
            onClick={() => {
              setRotate(0)
              setCurrPage(1)
              setValue('page', '1')
            }}
            variant='ghost'
            aria-label='rotate 90 degrees'>
            <History className='h-4 w-4' />
          </Button>
          <PdfFullscreen fileURL={url} />
          {/* <PdfFullscreen fileUrl={url} /> */}
        </div>
      </div>

      <div className='flex-1 w-full relative'>
        <div ref={targetRef} >
          <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
            <Document
              file={url}
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
                setValue('page', '1')
              }}
            >
              {isLoading && renderScale ?
                <Page
                  rotate={rotate}
                  // width={width ? width : 1}
                  pageNumber={currPage}
                  scale={scale}
                  key={"@" + renderScale}
                />
                : null}
              <Page
                className={cn(isLoading ? "hidden" : "")}
                rotate={rotate}
                // width={width ? width : 1}
                pageNumber={currPage}
                scale={scale}
                key={"@" + scale}
                loading={
                  <div className='flex justify-center'>
                    <Loader2 className='my-4 h-6 w-6 animate-spin' />
                  </div>
                }
                onRenderSuccess={() => {
                  console.log('on')
                  setRenderScale(scale)
                }}
              />
            </Document>
          </SimpleBar>
        </div>
      </div>
    </div>
  )
}
