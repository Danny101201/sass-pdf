import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/server'
import React from 'react'

interface UserAccountNavProps {
  name: string
  email: string
  imageUrl: string
}
export const UserAccountNav = ({ name, email, imageUrl }: UserAccountNavProps) => {
  return (
    <div>
      <LogoutLink>log out</LogoutLink>
    </div>
  )
}
