'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Paper, Title, Button, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    type: 'shift' | 'substitute_request'
    status?: string
    priority?: string
  }
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    // サンプルデータ
    const sampleEvents: CalendarEvent[] = [
      {
        id: '1',
        title: '数学 - 高1A',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        extendedProps: {
          type: 'shift',
          status: 'scheduled'
        }
      },
      {
        id: '2',
        title: '英語 - 中2B (代講依頼)',
        start: '2024-01-16T14:00:00',
        end: '2024-01-16T15:00:00',
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        extendedProps: {
          type: 'substitute_request',
          status: 'pending',
          priority: 'high'
        }
      }
    ]
    setEvents(sampleEvents)
  }, [])

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('新しいシフトのタイトルを入力してください:')
    if (title) {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        extendedProps: {
          type: 'shift',
          status: 'scheduled'
        }
      }
      setEvents([...events, newEvent])
      notifications.show({
        title: '成功',
        message: '新しいシフトが追加されました。',
        color: 'green',
      })
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const eventData = event.extendedProps
    
    if (eventData.type === 'substitute_request') {
      const accept = confirm('この代講依頼を引き受けますか？')
      if (accept) {
        // 代講依頼の引き受け処理
        notifications.show({
          title: '成功',
          message: '代講依頼を引き受けました。',
          color: 'green',
        })
      }
    } else {
      const createRequest = confirm('このシフトの代講依頼を作成しますか？')
      if (createRequest) {
        // 代講依頼の作成処理
        notifications.show({
          title: '成功',
          message: '代講依頼を作成しました。',
          color: 'green',
        })
      }
    }
  }

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>カレンダー</Title>
        <Button
          variant="outline"
          onClick={() => {
            notifications.show({
              title: '情報',
              message: '代講依頼作成機能は開発中です。',
              color: 'blue',
            })
          }}
        >
          代講依頼を作成
        </Button>
      </Group>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        locale="ja"
        height="auto"
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => {
          const event = eventInfo.event
          const extendedProps = event.extendedProps
          
          return (
            <div className="p-1 text-xs">
              <div className="font-medium truncate">{event.title}</div>
              {extendedProps.type === 'substitute_request' && (
                <div className="text-yellow-600 font-bold">代講依頼</div>
              )}
            </div>
          )
        }}
      />
    </Paper>
  )
}
