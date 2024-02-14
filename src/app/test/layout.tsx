import React from 'react'

const checkUserRole = () => {
  return 'user'
}

export default function RootLayout({
  Admin,
  User,
}: {
  Admin: React.ReactNode,
  User: React.ReactNode,
}) {
  const userRole = checkUserRole()
  return (
    <>{userRole === 'user' ? User : Admin}</>
  )
}