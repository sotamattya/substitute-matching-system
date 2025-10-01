'use client'

import { notifications } from '@mantine/notifications'
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'

export const showSuccessNotification = (title: string, message: string) => {
  notifications.show({
    id: `success-${Date.now()}`,
    title,
    message,
    color: 'green',
    icon: <IconCircleCheck size="1.2rem" />,
    autoClose: 4000,
    withCloseButton: false,
    loading: false,
  })
}

export const showErrorNotification = (title: string, message: string) => {
  notifications.show({
    id: `error-${Date.now()}`,
    title,
    message,
    color: 'red',
    icon: <IconX size="1.2rem" />,
    autoClose: 6000,
    withCloseButton: true,
    loading: false,
  })
}

export const showInfoNotification = (title: string, message: string) => {
  notifications.show({
    id: `info-${Date.now()}`,
    title,
    message,
    color: 'blue',
    icon: <IconInfoCircle size="1.2rem" />,
    autoClose: 5000,
    withCloseButton: false,
    loading: false,
  })
}

export const showWarningNotification = (title: string, message: string) => {
  notifications.show({
    id: `warning-${Date.now()}`,
    title,
    message,
    color: 'orange',
    icon: <IconAlertTriangle size="1.2rem" />,
    autoClose: 5000,
    withCloseButton: true,
    loading: false,
  })
}
