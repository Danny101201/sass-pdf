'use client'
import React from 'react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/utils/trpc'
const AuthCallbackPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const origin = searchParams.get('origin')
  const { isSuccess, isError, error } = trpc.authCallBack.useQuery(undefined, {
    retry: origin ? true : false,
    retryDelay: 500
  })
  if (isSuccess) {
    return router.push(origin ? `/${origin}` : '/dashboard')
  }
  if (error?.data?.code === 'UNAUTHORIZED') {
    return router.push('/login')
  }
  return (
    <div className='w-full mt-24 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-800' />
        <h3 className='font-semibold text-xl'>
          Setting up your account...
        </h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage