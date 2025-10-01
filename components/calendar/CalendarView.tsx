'use client'

import { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Paper, Title, Button, Group, TextInput, Textarea, Select, Stack, Modal } from '@mantine/core'
import { showSuccessNotification, showErrorNotification, showInfoNotification } from '@/components/ui/NotificationManager'
import { useForm } from '@mantine/form'

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
    shiftId?: string
    requestId?: string
  }
}

interface Shift {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  subject: string
  grade?: string
  location?: string
  status: string
  teacher: {
    id: string
    name: string
    email: string
  }
  substituteRequests?: SubstituteRequest[]
}

interface SubstituteRequest {
  id: string
  reason: string
  status: string
  priority: string
  shift: {
    id: string
    title: string
    startTime: string
    endTime: string
    subject: string
  }
  createdBy: {
    id: string
    name: string
  }
  acceptedBy?: {
    id: string
    name: string
  }
}

// 選択肢のデータ
const SUBJECTS = [
  '数学', '英語', '国語', '理科', '社会', '物理', '化学', '生物', '地学',
  '世界史', '日本史', '地理', '政治経済', '倫理', '現代社会', '数１'
]

// 生徒氏名は個人情報のため削除

const TIME_SLOTS = [
  { label: '5限（小学生集団） (17:15-18:15)', start: '17:15', end: '18:15' },
  { label: '5限 (17:15-18:35)', start: '17:15', end: '18:35' },
  { label: '5限 1/2 (17:05-17:50)', start: '17:05', end: '17:50' },
  { label: '5限 2/2 (17:50-18:35)', start: '17:50', end: '18:35' },
  { label: '6限 (18:45-20:05)', start: '18:45', end: '20:05' },
  { label: '7限 (20:15-21:35)', start: '20:15', end: '21:35' }
]

const LOCATIONS = [
  '○○校舎'
]

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [substituteRequests, setSubstituteRequests] = useState<SubstituteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [createShiftModal, setCreateShiftModal] = useState(false)
  const [createRequestModal, setCreateRequestModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // カスタマイズ可能な選択肢の状態
  const [customSubjects, setCustomSubjects] = useState<string[]>(SUBJECTS)
  const [customLocations, setCustomLocations] = useState<string[]>(LOCATIONS)
  const [customTimeSlots, setCustomTimeSlots] = useState(TIME_SLOTS)
  
  // 新しい項目を追加するための状態
  const [newSubject, setNewSubject] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newTimeSlotLabel, setNewTimeSlotLabel] = useState('')
  const [newTimeSlotStart, setNewTimeSlotStart] = useState('')
  const [newTimeSlotEnd, setNewTimeSlotEnd] = useState('')
  
  // 削除確認モーダルの状態
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: 'subject' | 'location' | 'timeSlot', value: string} | null>(null)

  // 定期的なシフト作成の状態
  const [isRecurringShift, setIsRecurringShift] = useState(false)
  const [recurringStartDate, setRecurringStartDate] = useState('')
  const [recurringEndDate, setRecurringEndDate] = useState('')
  const [recurringDays, setRecurringDays] = useState<number[]>([]) // 0=日曜日, 1=月曜日, ..., 6=土曜日

  // 時間割ごとの科目選択の状態
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [timeSlotSubjects, setTimeSlotSubjects] = useState<{[timeSlot: string]: string[]}>({})

  // シフト編集の状態
  const [editShiftModal, setEditShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  // まとめて削除の状態
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [bulkDeleteStartDate, setBulkDeleteStartDate] = useState('')
  const [bulkDeleteEndDate, setBulkDeleteEndDate] = useState('')
  const [bulkDeleteDays, setBulkDeleteDays] = useState<number[]>([]) // 0=日曜日, 1=月曜日, ..., 6=土曜日

  // 学期選択の状態
  const [selectedSemester, setSelectedSemester] = useState<string>('')
  const [timeSlotSubjectSemesters, setTimeSlotSubjectSemesters] = useState<{[timeSlot: string]: {[subject: string]: string}}>({})

  // 5分刻みの時間オプションを生成
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push({ value: timeString, label: timeString })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // 定期的なシフト作成のロジック
  const generateRecurringDates = (startDate: string, endDate: string, daysOfWeek: number[]) => {
    const dates: string[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (daysOfWeek.includes(date.getDay())) {
        dates.push(date.toISOString().split('T')[0])
      }
    }
    
    return dates
  }

  const shiftForm = useForm({
    initialValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      subjects: [] as string[],
      timeSlot: '',
      location: ''
    },
    validate: {
    }
  })

  const requestForm = useForm({
    initialValues: {
      reason: '',
      priority: 'NORMAL'
    },
    validate: {
      reason: (value) => (value.length < 1 ? '理由は必須です' : null),
    }
  })

  // データの取得
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // シフトデータの取得
      const shiftsResponse = await fetch('/api/shifts')
      if (shiftsResponse.ok) {
        const shiftsData = await shiftsResponse.json()
        setShifts(shiftsData.shifts || [])
      }

      // 代講依頼データの取得
      const requestsResponse = await fetch('/api/substitute-requests')
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setSubstituteRequests(requestsData.substituteRequests || [])
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
      showErrorNotification('エラー', 'データの取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // シフト作成モーダルを開く
  const handleOpenShiftModal = () => {
    shiftForm.reset()
    setCreateShiftModal(true)
  }

  // シフト作成モーダルを閉じる
  const handleCloseShiftModal = () => {
    setCreateShiftModal(false)
  }

  // シフト編集モーダルを開く
  const handleOpenEditShiftModal = (shift: Shift) => {
    setEditingShift(shift)
    setEditShiftModal(true)
    
    // 既存のシフトの時間割を特定
    const shiftStartTime = new Date(shift.startTime)
    const shiftEndTime = new Date(shift.endTime)
    const startTimeStr = `${shiftStartTime.getHours().toString().padStart(2, '0')}:${shiftStartTime.getMinutes().toString().padStart(2, '0')}`
    const endTimeStr = `${shiftEndTime.getHours().toString().padStart(2, '0')}:${shiftEndTime.getMinutes().toString().padStart(2, '0')}`
    
    // 該当する時間割を探す
    const matchingTimeSlot = customTimeSlots.find(slot => 
      slot.start === startTimeStr && slot.end === endTimeStr
    )
    
    if (matchingTimeSlot) {
      setSelectedTimeSlots([matchingTimeSlot.label])
      setTimeSlotSubjects({
        [matchingTimeSlot.label]: shift.subject ? shift.subject.split(', ') : []
      })
    } else {
      setSelectedTimeSlots([])
      setTimeSlotSubjects({})
    }
    
    // 編集用のフォームに値を設定
    const shiftDate = new Date(shift.startTime).toISOString().split('T')[0]
    shiftForm.setValues({
      title: shift.title || '',
      description: shift.description || '',
      startTime: shiftDate,
      endTime: '',
      subjects: shift.subject ? shift.subject.split(', ') : [],
      timeSlot: '',
      location: shift.location || ''
    })
  }

  // シフト編集モーダルを閉じる
  const handleCloseEditShiftModal = () => {
    setEditShiftModal(false)
    setEditingShift(null)
    shiftForm.reset()
  }

  // 新しい科目を追加
  const addNewSubject = () => {
    if (newSubject.trim() && !customSubjects.includes(newSubject.trim())) {
      setCustomSubjects([...customSubjects, newSubject.trim()])
      setNewSubject('')
    }
  }

  // 新しい場所を追加
  const addNewLocation = () => {
    if (newLocation.trim() && !customLocations.includes(newLocation.trim())) {
      setCustomLocations([...customLocations, newLocation.trim()])
      setNewLocation('')
    }
  }

  // 新しい時間枠を追加
  const addNewTimeSlot = () => {
    if (newTimeSlotLabel.trim() && newTimeSlotStart && newTimeSlotEnd) {
      const newSlot = {
        label: newTimeSlotLabel.trim(),
        start: newTimeSlotStart,
        end: newTimeSlotEnd
      }
      setCustomTimeSlots([...customTimeSlots, newSlot])
      setNewTimeSlotLabel('')
      setNewTimeSlotStart('')
      setNewTimeSlotEnd('')
    }
  }

  // 削除確認モーダルを開く
  const openDeleteConfirm = (type: 'subject' | 'location' | 'timeSlot', value: string) => {
    setItemToDelete({ type, value })
    setDeleteConfirmModal(true)
  }

  // 削除を実行
  const confirmDelete = () => {
    if (!itemToDelete) return

    switch (itemToDelete.type) {
      case 'subject':
        setCustomSubjects(customSubjects.filter(subject => subject !== itemToDelete.value))
        break
      case 'location':
        setCustomLocations(customLocations.filter(location => location !== itemToDelete.value))
        break
      case 'timeSlot':
        setCustomTimeSlots(customTimeSlots.filter(slot => slot.label !== itemToDelete.value))
        break
    }

    setDeleteConfirmModal(false)
    setItemToDelete(null)
  }

  // 削除をキャンセル
  const cancelDelete = () => {
    setDeleteConfirmModal(false)
    setItemToDelete(null)
  }

  // 科目を削除
  const removeSubject = (subjectToRemove: string) => {
    openDeleteConfirm('subject', subjectToRemove)
  }

  // 場所を削除
  const removeLocation = (locationToRemove: string) => {
    openDeleteConfirm('location', locationToRemove)
  }

  // 時間枠を削除
  const removeTimeSlot = (labelToRemove: string) => {
    openDeleteConfirm('timeSlot', labelToRemove)
  }

  // 時間割選択の処理
  const handleTimeSlotChange = (timeSlot: string, checked: boolean) => {
    if (checked) {
      setSelectedTimeSlots([...selectedTimeSlots, timeSlot])
      // 新しい時間割が選択された場合、空の科目配列を初期化
      if (!timeSlotSubjects[timeSlot]) {
        setTimeSlotSubjects({...timeSlotSubjects, [timeSlot]: []})
      }
    } else {
      setSelectedTimeSlots(selectedTimeSlots.filter(slot => slot !== timeSlot))
      // 時間割が削除された場合、その時間割の科目選択も削除
      const newTimeSlotSubjects = {...timeSlotSubjects}
      delete newTimeSlotSubjects[timeSlot]
      setTimeSlotSubjects(newTimeSlotSubjects)
    }
  }

  // 時間割ごとの科目選択の処理
  const handleTimeSlotSubjectChange = (timeSlot: string, subject: string, checked: boolean) => {
    const currentSubjects = timeSlotSubjects[timeSlot] || []
    if (checked) {
      setTimeSlotSubjects({
        ...timeSlotSubjects,
        [timeSlot]: [...currentSubjects, subject]
      })
    } else {
      setTimeSlotSubjects({
        ...timeSlotSubjects,
        [timeSlot]: currentSubjects.filter(s => s !== subject)
      })
    }
  }

  // カレンダーイベントの生成
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = []

    // シフトをイベントに変換
    shifts.forEach(shift => {
      calendarEvents.push({
        id: `shift-${shift.id}`,
        title: `${shift.subject} - ${shift.title}`,
        start: shift.startTime,
        end: shift.endTime,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        extendedProps: {
          type: 'shift',
          status: shift.status,
          shiftId: shift.id
        }
      })
    })

    // 代講依頼をイベントに変換
    substituteRequests.forEach(request => {
      const shift = shifts.find(s => s.id === request.shift.id)
      if (shift) {
        calendarEvents.push({
          id: `request-${request.id}`,
          title: `代講依頼: ${shift.subject} - ${shift.title}`,
          start: shift.startTime,
          end: shift.endTime,
          backgroundColor: request.status === 'PENDING' ? '#f59e0b' : 
                          request.status === 'ACCEPTED' ? '#10b981' : '#ef4444',
          borderColor: request.status === 'PENDING' ? '#d97706' : 
                      request.status === 'ACCEPTED' ? '#059669' : '#dc2626',
          extendedProps: {
            type: 'substitute_request',
            status: request.status,
            priority: request.priority,
            requestId: request.id,
            shiftId: request.shift.id
          }
        })
      }
    })

    setEvents(calendarEvents)
  }, [shifts, substituteRequests])

  // まとめてシフト削除
  const handleBulkDeleteShifts = async () => {
    if (isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 削除対象の日付を生成
      const datesToDelete = generateRecurringDates(bulkDeleteStartDate, bulkDeleteEndDate, bulkDeleteDays)
      
      if (datesToDelete.length === 0) {
        showErrorNotification('エラー', '削除対象の日付がありません。')
        setIsSubmitting(false)
        return
      }

      let successCount = 0
      let errorCount = 0

      // 各日付のシフトを削除
      for (const date of datesToDelete) {
        const shiftsOnDate = shifts.filter(shift => {
          const shiftDate = new Date(shift.startTime).toISOString().split('T')[0]
          return shiftDate === date
        })

        for (const shift of shiftsOnDate) {
          const response = await fetch(`/api/shifts/${shift.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        }
      }

      if (successCount > 0) {
        showSuccessNotification('成功', `${successCount}件のシフトが削除されました${errorCount > 0 ? ` (${errorCount}件失敗)` : ''}`)
        setBulkDeleteModal(false)
        setBulkDeleteStartDate('')
        setBulkDeleteEndDate('')
        setBulkDeleteDays([])
        await fetchData()
      } else {
        showErrorNotification('エラー', 'シフトの削除に失敗しました。')
      }
    } catch (error) {
      showErrorNotification('エラー', '予期しないエラーが発生しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // シフト削除
  const handleDeleteShift = async () => {
    if (!editingShift || isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/shifts/${editingShift.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccessNotification('成功', 'シフトが削除されました。')
        handleCloseEditShiftModal()
        await fetchData()
      } else {
        const error = await response.json()
        showErrorNotification('エラー', error.error || 'シフトの削除に失敗しました。')
      }
    } catch (error) {
      showErrorNotification('エラー', '予期しないエラーが発生しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // シフト更新
  const handleUpdateShift = async (values: any) => {
    if (!editingShift || isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 選択された時間割と科目を確認
      if (selectedTimeSlots.length === 0) {
        showErrorNotification('エラー', '時間割が選択されていません。')
        setIsSubmitting(false)
        return
      }

      // 各時間割に科目が選択されているか確認
      let hasValidSubjects = false
      for (const timeSlot of selectedTimeSlots) {
        if (timeSlotSubjects[timeSlot] && timeSlotSubjects[timeSlot].length > 0) {
          hasValidSubjects = true
          break
        }
      }

      if (!hasValidSubjects) {
        showErrorNotification('エラー', '少なくとも1つの時間割に科目を選択してください。')
        setIsSubmitting(false)
        return
      }

      // 既存のシフトを削除して新しいシフトを作成
      const deleteResponse = await fetch(`/api/shifts/${editingShift.id}`, {
        method: 'DELETE',
      })

      if (!deleteResponse.ok) {
        showErrorNotification('エラー', 'シフトの更新に失敗しました。')
        setIsSubmitting(false)
        return
      }

      // 新しいシフトを作成
      const shiftDate = new Date(editingShift.startTime).toISOString().split('T')[0]
      let successCount = 0
      let errorCount = 0

      for (const timeSlotLabel of selectedTimeSlots) {
        const selectedTimeSlot = customTimeSlots.find(slot => slot.label === timeSlotLabel)
        if (!selectedTimeSlot) continue

        const subjectsForThisTimeSlot = timeSlotSubjects[timeSlotLabel] || []
        if (subjectsForThisTimeSlot.length === 0) continue

        const [startHour, startMinute] = selectedTimeSlot.start.split(':').map(Number)
        const [endHour, endMinute] = selectedTimeSlot.end.split(':').map(Number)
        
        const startTime = new Date(shiftDate)
        startTime.setHours(startHour, startMinute, 0, 0)
        
        const endTime = new Date(shiftDate)
        endTime.setHours(endHour, endMinute, 0, 0)

        const shiftData = {
          title: '',
          description: values.description || '',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          subject: subjectsForThisTimeSlot.join(', '),
          grade: '',
          location: values.location || ''
        }

        const response = await fetch('/api/shifts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shiftData),
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (successCount > 0) {
        showSuccessNotification('成功', `シフトが更新されました${errorCount > 0 ? ` (${errorCount}件失敗)` : ''}`)
        handleCloseEditShiftModal()
        setSelectedTimeSlots([])
        setTimeSlotSubjects({})
        await fetchData()
      } else {
        showErrorNotification('エラー', 'シフトの更新に失敗しました。')
      }
    } catch (error) {
      showErrorNotification('エラー', '予期しないエラーが発生しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // シフト作成
  const handleCreateShift = async (values: any) => {
    if (isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 選択された時間割を確認
      if (selectedTimeSlots.length === 0) {
        showErrorNotification('エラー', '時間割が選択されていません。')
        setIsSubmitting(false)
        return
      }

      // 各時間割に科目が選択されているか確認
      let hasValidSubjects = false
      for (const timeSlot of selectedTimeSlots) {
        if (timeSlotSubjects[timeSlot] && timeSlotSubjects[timeSlot].length > 0) {
          hasValidSubjects = true
          break
        }
      }

      if (!hasValidSubjects) {
        showErrorNotification('エラー', '少なくとも1つの時間割に科目を選択してください。')
        setIsSubmitting(false)
        return
      }

      let datesToCreate: string[] = []
      
      if (isRecurringShift && recurringStartDate && recurringEndDate && recurringDays.length > 0) {
        // 定期的なシフトの場合
        datesToCreate = generateRecurringDates(recurringStartDate, recurringEndDate, recurringDays)
      } else {
        // 単発のシフトの場合
        datesToCreate = [values.startTime]
      }

      let successCount = 0
      let errorCount = 0

      // 各日付と各時間割の組み合わせでシフトを作成
      for (const date of datesToCreate) {
        for (const timeSlotLabel of selectedTimeSlots) {
          const selectedTimeSlot = customTimeSlots.find(slot => slot.label === timeSlotLabel)
          if (!selectedTimeSlot) continue

          // この時間割の科目を取得
          const subjectsForThisTimeSlot = timeSlotSubjects[timeSlotLabel] || []
          if (subjectsForThisTimeSlot.length === 0) continue

          const [startHour, startMinute] = selectedTimeSlot.start.split(':').map(Number)
          const [endHour, endMinute] = selectedTimeSlot.end.split(':').map(Number)
          
          const startTime = new Date(date)
          startTime.setHours(startHour, startMinute, 0, 0)
          
          const endTime = new Date(date)
          endTime.setHours(endHour, endMinute, 0, 0)

          // 送信データを準備
          const shiftData = {
            title: '', // タイトル機能を削除
            description: values.description,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            subject: subjectsForThisTimeSlot.join(', '), // この時間割の科目をカンマ区切りで結合
            grade: '', // 生徒情報は削除
            location: values.location
          }

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify(shiftData),
      })

      if (response.ok) {
            successCount++
      } else {
            errorCount++
        const error = await response.json()
            console.error(`シフト作成エラー (${date}, ${timeSlotLabel}):`, error.error)
          }
        }
      }

      if (successCount > 0) {
        showSuccessNotification('成功', `${successCount}件のシフトが作成されました${errorCount > 0 ? ` (${errorCount}件失敗)` : ''}`)
        handleCloseShiftModal()
        shiftForm.reset()
        setIsRecurringShift(false)
        setRecurringStartDate('')
        setRecurringEndDate('')
        setRecurringDays([])
        setSelectedTimeSlots([])
        setTimeSlotSubjects({})
        await fetchData()
      } else {
        showErrorNotification('エラー', 'シフトの作成に失敗しました。')
      }
    } catch (error) {
      showErrorNotification('エラー', '予期しないエラーが発生しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 代講依頼作成
  const handleCreateRequest = async (values: any) => {
    if (!selectedShift) return

    try {
      const response = await fetch('/api/substitute-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shiftId: selectedShift.id,
          reason: values.reason,
          priority: values.priority,
        }),
      })

      if (response.ok) {
        showSuccessNotification('成功', '代講依頼が作成されました。')
        setCreateRequestModal(false)
        setSelectedShift(null)
        requestForm.reset()
        fetchData()
      } else {
        const error = await response.json()
        showErrorNotification('エラー', error.error || '代講依頼の作成に失敗しました。')
      }
    } catch (error) {
      showErrorNotification('エラー', '予期しないエラーが発生しました。')
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const eventData = event.extendedProps
    
    if (eventData.type === 'substitute_request') {
      // 代講依頼の詳細表示
      const request = substituteRequests.find(r => r.id === eventData.requestId)
      if (request) {
        showInfoNotification('代講依頼詳細', `理由: ${request.reason}\n優先度: ${request.priority}\nステータス: ${request.status}`)
      }
    } else if (eventData.type === 'shift') {
      // シフトの詳細表示と編集・代講依頼作成
      const shift = shifts.find(s => s.id === eventData.shiftId)
      if (shift) {
        // シフト編集モーダルを開く
        handleOpenEditShiftModal(shift)
      }
    }
  }

  const handleDateSelect = (selectInfo: any) => {
    // 日付選択時にシフト作成モーダルを開く
    // 日付フォーマットを修正（datetime-local用）
    const startDate = new Date(selectInfo.start)
    const endDate = new Date(selectInfo.end)
    
    // デフォルトの時間を設定（9:00-10:00）
    startDate.setHours(9, 0, 0, 0)
    endDate.setHours(10, 0, 0, 0)
    
    const startTime = startDate.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM形式
    const endTime = endDate.toISOString().slice(0, 16)
    
    // フォームの値をリセットしてから新しい値を設定
    shiftForm.reset()
    shiftForm.setValues({
      title: '',
      description: '',
      startTime: startTime,
      endTime: endTime,
          subjects: [],
          timeSlot: '',
      location: ''
    })
    setCreateShiftModal(true)
  }

  if (loading) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">データを読み込み中...</p>
        </div>
      </Paper>
    )
  }

  return (
    <>
      <div style={{ 
        backgroundColor: '#ffffff', 
        minHeight: '100vh',
        padding: '16px'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px 24px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 style={{
                fontSize: '22px',
                fontWeight: '400',
                color: '#3c4043',
                margin: 0
              }}>
                シフト管理
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setBulkDeleteModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  color: '#5f6368',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🗑️</span>
                まとめて削除
              </button>
              <button
                onClick={handleOpenShiftModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1a73e8',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}
              >
                <span>+</span>
            シフトを作成
              </button>
            </div>
          </div>
        </div>

        {/* カレンダーコンテナ */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
        
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="dayGridMonth"
          editable={false}
          selectable={true}
          selectMirror={true}
            dayMaxEvents={3}
          weekends={true}
          locale="ja"
          height="auto"
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          selectOverlap={false}
            moreLinkClick="popover"
            eventDisplay="block"
            eventTextColor="#000000"
            eventBackgroundColor="#e3f2fd"
            eventBorderColor="#1a73e8"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            dayHeaderFormat={{
              weekday: 'short'
            }}
            titleFormat={{
              year: 'numeric',
              month: 'long'
            }}
            buttonText={{
              today: '今日',
              month: '月',
              week: '週',
              day: '日'
            }}
          eventContent={(eventInfo) => {
            const event = eventInfo.event
            const extendedProps = event.extendedProps
            
              if (extendedProps?.type === 'shift') {
                return {
                  html: `
                    <div style="
                      padding: 2px 4px;
                      font-size: 12px;
                      font-weight: 500;
                      color: #000000;
                      background: #e3f2fd;
                      border-radius: 3px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      border-left: 3px solid #1557b0;
                    ">
                      ${event.title}
              </div>
                  `
                }
              } else if (extendedProps?.type === 'substitute_request') {
                const status = extendedProps?.status
                const bgColor = status === 'PENDING' ? '#f59e0b' : 
                               status === 'ACCEPTED' ? '#10b981' : '#ef4444'
                const borderColor = status === 'PENDING' ? '#d97706' : 
                                  status === 'ACCEPTED' ? '#059669' : '#dc2626'
                return {
                  html: `
                    <div style="
                      padding: 2px 4px;
                      font-size: 12px;
                      font-weight: 500;
                      color: #000000;
                      background: ${status === 'PENDING' ? '#fef3c7' : 
                                 status === 'ACCEPTED' ? '#d1fae5' : '#fee2e2'};
                      border-radius: 3px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      border-left: 3px solid ${borderColor};
                    ">
                      ${event.title}
                    </div>
                  `
                }
              }
              return { html: event.title }
            }}
          />
        </div>
      </div>



      {/* シフト作成モーダル */}
      {createShiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2)',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '400', 
                color: '#3c4043' 
              }}>
                シフトを作成
              </h2>
              <button
                onClick={handleCloseShiftModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#5f6368',
                  padding: '4px',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={shiftForm.onSubmit(handleCreateShift)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#3c4043'
                  }}>
                    時間割 * (複数選択可能)
                  </label>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    border: '1px solid #dadce0', 
                    borderRadius: '4px', 
                    padding: '8px',
                    backgroundColor: 'white'
                  }}>
                    {customTimeSlots.map((slot) => (
                      <label key={slot.label} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        backgroundColor: selectedTimeSlots.includes(slot.label) ? '#dbeafe' : 'transparent',
                        color: '#000000'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedTimeSlots.includes(slot.label)}
                          onChange={(e) => handleTimeSlotChange(slot.label, e.target.checked)}
                          style={{ margin: 0 }}
                        />
                        {slot.label}
                      </label>
                    ))}
          </div>
                  
                  {/* 時間割管理 */}
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>時間割管理:</div>
                    
                    {/* 新しい時間割を追加 */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>新しい時間割を追加:</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="ラベル (例: 補講)"
                          value={newTimeSlotLabel}
                          onChange={(e) => setNewTimeSlotLabel(e.target.value)}
                          style={{ flex: '1', minWidth: '120px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                        />
                        <select
                          value={newTimeSlotStart}
                          onChange={(e) => setNewTimeSlotStart(e.target.value)}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                        >
                          <option value="">開始時間</option>
                          {timeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '12px', alignSelf: 'center' }}>〜</span>
                        <select
                          value={newTimeSlotEnd}
                          onChange={(e) => setNewTimeSlotEnd(e.target.value)}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                        >
                          <option value="">終了時間</option>
                          {timeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addNewTimeSlot}
                          style={{ padding: '4px 8px', backgroundColor: '#e3f2fd', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          追加
                        </button>
        </div>
                    </div>
                    
                    {/* 時間割の一覧と削除 */}
                    {customTimeSlots.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>時間割一覧 (削除可能):</div>
                        <div style={{ maxHeight: '80px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px' }}>
                          {customTimeSlots.map((slot) => (
                            <div key={slot.label} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '2px 4px',
                              fontSize: '11px',
                              backgroundColor: '#f3f4f6',
                              marginBottom: '2px',
                              borderRadius: '2px',
                              color: '#000000' // フォント色を黒に変更
                            }}>
                              <span>{slot.label}</span>
                              <button
                                type="button"
                                onClick={() => removeTimeSlot(slot.label)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#ef4444', 
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '1px 4px'
                                }}
                                title="削除"
                              >
                                ×
                              </button>
                            </div>
                          ))}
          </div>
        </div>
      )}
                  </div>
                </div>

                {/* 時間割ごとの科目選択 */}
                {selectedTimeSlots.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      時間割ごとの科目選択 *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedTimeSlots.map((timeSlot) => (
                        <div key={timeSlot} style={{ 
                          padding: '12px', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '6px', 
                          backgroundColor: '#f9fafb' 
                        }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#000000' 
                          }}>
                            {timeSlot}
                          </div>
                          <div style={{ 
                            maxHeight: '100px', 
                            overflowY: 'auto', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '4px', 
                            padding: '6px',
                            backgroundColor: 'white'
                          }}>
                            {customSubjects.map((subject) => (
                              <label key={subject} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '2px',
                                backgroundColor: (timeSlotSubjects[timeSlot] || []).includes(subject) ? '#dbeafe' : 'transparent',
                                color: '#000000'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={(timeSlotSubjects[timeSlot] || []).includes(subject)}
                                  onChange={(e) => handleTimeSlotSubjectChange(timeSlot, subject, e.target.checked)}
                                  style={{ margin: 0 }}
                                />
                                {subject}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    科目 * (複数選択可)
                    {shiftForm.values.subjects.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        ({shiftForm.values.subjects.length}個選択中)
                      </span>
                    )}
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px'
                  }}>
                    {customSubjects.map((subject) => (
                      <label key={subject} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        backgroundColor: shiftForm.values.subjects.includes(subject) ? '#dbeafe' : 'transparent',
                        color: '#000000' // フォント色を黒に変更
                      }}>
                        <input
                          type="checkbox"
                          value={subject}
                          checked={shiftForm.values.subjects.includes(subject)}
                          onChange={(e) => {
                            const value = e.target.value
                            const currentSubjects = shiftForm.values.subjects
                            if (e.target.checked) {
                              shiftForm.setFieldValue('subjects', [...currentSubjects, value])
                            } else {
                              shiftForm.setFieldValue('subjects', currentSubjects.filter(s => s !== value))
                            }
                          }}
                          style={{ margin: 0 }}
                        />
                        {subject}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            removeSubject(subject)
                          }}
                          style={{ 
                            marginLeft: 'auto', 
                            background: 'none', 
                            border: 'none', 
                            color: '#ef4444', 
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px'
                          }}
                          title="削除"
                        >
                          ×
                        </button>
                      </label>
                    ))}
                  </div>
                  
                  {/* 科目管理 */}
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>科目管理:</div>
                    
                    {/* 新しい科目を追加 */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>新しい科目を追加:</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          type="text"
                          placeholder="科目名 (例: 数１)"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          style={{ flex: '1', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={addNewSubject}
                          style={{ padding: '4px 8px', backgroundColor: '#e3f2fd', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          追加
                        </button>
                      </div>
                    </div>
                    
                    {/* 科目の一覧と削除 */}
                    {customSubjects.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>科目一覧 (削除可能):</div>
                        <div style={{ maxHeight: '60px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px' }}>
                          {customSubjects.map((subject) => (
                            <div key={subject} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '2px 4px',
                              fontSize: '11px',
                              backgroundColor: '#f3f4f6',
                              marginBottom: '2px',
                              borderRadius: '2px',
                              color: '#000000' // フォント色を黒に変更
                            }}>
                              <span>{subject}</span>
                              <button
                                type="button"
                                onClick={() => removeSubject(subject)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#ef4444', 
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '1px 4px'
                                }}
                                title="削除"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    校舎
                  </label>
                  <select
                    {...shiftForm.getInputProps('location')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">校舎を選択してください</option>
                    {customLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  
                  {/* 校舎管理 */}
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>校舎管理:</div>
                    
                    {/* 新しい場所を追加 */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>新しい校舎を追加:</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          type="text"
                          placeholder="校舎名 (例: ○○校舎)"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          style={{ flex: '1', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={addNewLocation}
                          style={{ padding: '4px 8px', backgroundColor: '#e3f2fd', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          追加
                        </button>
                      </div>
                    </div>
                    
                    {/* カスタム場所の一覧と削除 */}
                    {customLocations.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>校舎一覧 (削除可能):</div>
                        <div style={{ maxHeight: '60px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px' }}>
                          {customLocations.map((location) => (
                            <div key={location} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '2px 4px',
                              fontSize: '11px',
                              backgroundColor: '#f3f4f6',
                              marginBottom: '2px',
                              borderRadius: '2px',
                              color: '#000000' // フォント色を黒に変更
                            }}>
                              <span>{location}</span>
                              <button
                                type="button"
                                onClick={() => removeLocation(location)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#ef4444', 
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '1px 4px'
                                }}
                                title="削除"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    説明
                  </label>
                  <textarea
                    placeholder="シフトの詳細説明（任意）"
              {...shiftForm.getInputProps('description')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* 定期的なシフト作成オプション */}
                <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      id="recurringShift"
                      checked={isRecurringShift}
                      onChange={(e) => setIsRecurringShift(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <label htmlFor="recurringShift" style={{ fontWeight: '500', cursor: 'pointer', color: '#000000' }}>
                      定期的なシフトを作成
                    </label>
                  </div>

                  {isRecurringShift && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#000000' }}>
                            開始日
                          </label>
                          <input
                            type="date"
                            value={recurringStartDate}
                            onChange={(e) => setRecurringStartDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#000000' }}>
                            終了日
                          </label>
                          <input
                            type="date"
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#000000' }}>
                          曜日を選択
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { value: 0, label: '日' },
                            { value: 1, label: '月' },
                            { value: 2, label: '火' },
                            { value: 3, label: '水' },
                            { value: 4, label: '木' },
                            { value: 5, label: '金' },
                            { value: 6, label: '土' }
                          ].map((day) => (
                            <label key={day.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={recurringDays.includes(day.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRecurringDays([...recurringDays, day.value])
                                  } else {
                                    setRecurringDays(recurringDays.filter(d => d !== day.value))
                                  }
                                }}
                                style={{ marginRight: '4px' }}
                              />
                              <span style={{ fontSize: '12px', color: '#000000' }}>{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {recurringStartDate && recurringEndDate && recurringDays.length > 0 && (
                        <div style={{ padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '4px', fontSize: '11px', color: '#000000' }}>
                          <strong>作成予定:</strong> {generateRecurringDates(recurringStartDate, recurringEndDate, recurringDays).length}件のシフト
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleCloseShiftModal}
                    style={{
                      padding: '10px 24px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#5f6368',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      minWidth: '88px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'white'
                    }}
              >
                キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: isSubmitting ? '#9ca3af' : '#1a73e8',
                      color: '#ffffff',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      minWidth: '88px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#1557b0'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#1a73e8'
                      }
                    }}
                  >
                    {isSubmitting ? '作成中...' : '作成'}
                  </button>
                </div>
              </div>
        </form>
          </div>
        </div>
      )}

      {/* シフト編集モーダル */}
      {editShiftModal && editingShift && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold', color: '#000000' }}>
              シフトを編集
            </h2>
            
            <form onSubmit={shiftForm.onSubmit(handleUpdateShift)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    時間割 * (複数選択可能)
                  </label>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    padding: '8px',
                    backgroundColor: 'white'
                  }}>
                    {customTimeSlots.map((slot) => (
                      <label key={slot.label} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        backgroundColor: selectedTimeSlots.includes(slot.label) ? '#dbeafe' : 'transparent',
                        color: '#000000'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedTimeSlots.includes(slot.label)}
                          onChange={(e) => handleTimeSlotChange(slot.label, e.target.checked)}
                          style={{ margin: 0 }}
                        />
                        {slot.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    説明
                  </label>
                  <textarea
                    placeholder="シフトの詳細説明（任意）"
                    {...shiftForm.getInputProps('description')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    科目 * (複数選択可)
                    {shiftForm.values.subjects.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        ({shiftForm.values.subjects.length}個選択中)
                      </span>
                    )}
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px'
                  }}>
                    {customSubjects.map((subject) => (
                      <label key={subject} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        backgroundColor: shiftForm.values.subjects.includes(subject) ? '#dbeafe' : 'transparent',
                        color: '#000000'
                      }}>
                        <input
                          type="checkbox"
                          value={subject}
                          checked={shiftForm.values.subjects.includes(subject)}
                          onChange={(e) => {
                            const value = e.target.value
                            const currentSubjects = shiftForm.values.subjects
                            if (e.target.checked) {
                              shiftForm.setFieldValue('subjects', [...currentSubjects, value])
                            } else {
                              shiftForm.setFieldValue('subjects', currentSubjects.filter(s => s !== value))
                            }
                          }}
                          style={{ margin: 0 }}
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 時間割ごとの科目選択 */}
                {selectedTimeSlots.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      時間割ごとの科目選択 *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedTimeSlots.map((timeSlot) => (
                        <div key={timeSlot} style={{ 
                          padding: '12px', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '6px', 
                          backgroundColor: '#f9fafb' 
                        }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#000000' 
                          }}>
                            {timeSlot}
                          </div>
                          <div style={{ 
                            maxHeight: '100px', 
                            overflowY: 'auto', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '4px', 
                            padding: '6px',
                            backgroundColor: 'white'
                          }}>
                            {customSubjects.map((subject) => (
                              <label key={subject} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '2px',
                                backgroundColor: (timeSlotSubjects[timeSlot] || []).includes(subject) ? '#dbeafe' : 'transparent',
                                color: '#000000'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={(timeSlotSubjects[timeSlot] || []).includes(subject)}
                                  onChange={(e) => handleTimeSlotSubjectChange(timeSlot, subject, e.target.checked)}
                                  style={{ margin: 0 }}
                                />
                                {subject}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    校舎
                  </label>
                  <select
                    {...shiftForm.getInputProps('location')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">校舎を選択してください</option>
                    {customLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleDeleteShift}
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#ef4444',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {isSubmitting ? '削除中...' : '削除'}
                  </button>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={handleCloseEditShiftModal}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
              >
                キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                        color: '#ffffff',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {isSubmitting ? '更新中...' : '更新'}
                    </button>
                  </div>
                </div>
              </div>
        </form>
          </div>
        </div>
      )}

      {/* まとめて削除モーダル */}
      {bulkDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2)',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '400', 
                color: '#3c4043' 
              }}>
                まとめてシフト削除
              </h2>
              <button
                onClick={() => {
                  setBulkDeleteModal(false)
                  setBulkDeleteStartDate('')
                  setBulkDeleteEndDate('')
                  setBulkDeleteDays([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#5f6368',
                  padding: '4px',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '12px', border: '1px solid #fecaca', borderRadius: '6px', backgroundColor: '#fef2f2' }}>
                <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                  ⚠️ 注意: この操作は取り消せません。削除されたシフトは復元できません。
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#000000' }}>
                    開始日
                  </label>
                  <input
                    type="date"
                    value={bulkDeleteStartDate}
                    onChange={(e) => setBulkDeleteStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#000000' }}>
                    終了日
                  </label>
                  <input
                    type="date"
                    value={bulkDeleteEndDate}
                    onChange={(e) => setBulkDeleteEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#000000' }}>
                  削除する曜日を選択
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { value: 0, label: '日' },
                    { value: 1, label: '月' },
                    { value: 2, label: '火' },
                    { value: 3, label: '水' },
                    { value: 4, label: '木' },
                    { value: 5, label: '金' },
                    { value: 6, label: '土' }
                  ].map((day) => (
                    <label key={day.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={bulkDeleteDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkDeleteDays([...bulkDeleteDays, day.value])
                          } else {
                            setBulkDeleteDays(bulkDeleteDays.filter(d => d !== day.value))
                          }
                        }}
                        style={{ marginRight: '4px' }}
                      />
                      <span style={{ fontSize: '12px', color: '#000000' }}>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {bulkDeleteStartDate && bulkDeleteEndDate && bulkDeleteDays.length > 0 && (
                <div style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '4px', fontSize: '11px', color: '#dc2626' }}>
                  <strong>削除予定:</strong> {generateRecurringDates(bulkDeleteStartDate, bulkDeleteEndDate, bulkDeleteDays).length}日分のシフト
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setBulkDeleteModal(false)
                    setBulkDeleteStartDate('')
                    setBulkDeleteEndDate('')
                    setBulkDeleteDays([])
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteShifts}
                  disabled={isSubmitting || !bulkDeleteStartDate || !bulkDeleteEndDate || bulkDeleteDays.length === 0}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: isSubmitting ? '#9ca3af' : '#dc2626',
                    color: '#ffffff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {isSubmitting ? '削除中...' : '削除実行'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 代講依頼作成モーダル */}
      <Modal
        opened={createRequestModal}
        onClose={() => setCreateRequestModal(false)}
        title="代講依頼を作成"
        size="md"
      >
        {selectedShift && (
          <form onSubmit={requestForm.onSubmit(handleCreateRequest)}>
            <Stack>
              <div>
                <strong>シフト情報:</strong>
                <p>{selectedShift.subject} - {selectedShift.title}</p>
                <p>{new Date(selectedShift.startTime).toLocaleString('ja-JP')} ～ {new Date(selectedShift.endTime).toLocaleString('ja-JP')}</p>
              </div>
              
              <Textarea
                label="代講依頼の理由"
                placeholder="代講が必要な理由を入力してください"
                required
                {...requestForm.getInputProps('reason')}
              />
              
              <Select
                label="優先度"
                data={[
                  { value: 'LOW', label: '低' },
                  { value: 'NORMAL', label: '普通' },
                  { value: 'HIGH', label: '高' },
                  { value: 'URGENT', label: '緊急' }
                ]}
                {...requestForm.getInputProps('priority')}
              />
              
              <Group justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => setCreateRequestModal(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit">
                  依頼を作成
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
      
      {/* 削除確認モーダル */}
      {deleteConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              削除確認
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
              「{itemToDelete?.value}」を削除しますか？この操作は取り消せません。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

