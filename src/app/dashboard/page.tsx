import { DashBoard } from '@/components/DashBoard'
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'
import React from 'react'

const DashboardPage = async () => {
  // eventual consistency
  const { getUser } = getKindeServerSession() // user is authenticated and also in database
  const user = getUser()
  if (!user || !user.id) redirect('/auth-callback?origin=dashboard')
 
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id
    }
  })
  if (!dbUser) redirect('/auth-callback?origin=dashboard')

  return (
    <DashBoard />
  )
}

export default DashboardPage