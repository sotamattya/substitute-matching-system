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
    TextInput: {
      defaultProps: {
        styles: {
          input: {
            color: '#1a1a1a',
            backgroundColor: '#ffffff',
            borderColor: '#e0e0e0',
            '&:focus': {
              borderColor: '#1a73e8',
              boxShadow: '0 0 0 2px rgba(26, 115, 232, 0.2)',
            },
            '&::placeholder': {
              color: '#9ca3af',
            },
          },
          label: {
            color: '#374151',
            fontWeight: 500,
          },
        },
      },
    },
    Button: {
      defaultProps: {
        styles: {
          root: {
            color: '#ffffff',
          },
        },
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
