'use client'

import { SessionProvider } from 'next-auth/react'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

const theme = createTheme({
  components: {
    Notification: {
      defaultProps: {
        radius: 'md',
        shadow: 'md',
      },
    },
  },
})

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <MantineProvider theme={theme}>
        <Notifications 
          position="top-right"
          zIndex={1000}
        />
        {children}
      </MantineProvider>
    </SessionProvider>
  )
}
