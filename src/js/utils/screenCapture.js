const isIOS = () => {
  return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ].includes(navigator.platform)
      || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

const getVideoMimeType = () => {
  const iOS = isIOS()

  const types = iOS ? [
    'video/mp4;codecs=h264,mp4a.40.2',
    'video/mp4;codecs=h264',
    'video/mp4'
  ] : [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using MIME type:', type)
      return type
    }
  }

  throw new Error('No supported video MIME type found')
}

export const showNotification = (message, type = 'info') => {
  console.log(`[Notification] ${message}`)
  const notification = document.createElement('div')
  notification.style.cssText = `
      position: fixed;
      top: ${type === 'error' ? '20px' : '40px'};
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 6px;
      color: white;
      z-index: 10000;
      background: ${type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(172, 172, 172, 0.2)'};
      display: none;
  `
  notification.textContent = message
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 400)
}

// components/RecordingIndicator.js
export const showRecordingIndicator = (show) => {
  let indicator = document.getElementById('record-indicator')

  if (show && !indicator) {
    indicator = document.createElement('div')
    indicator.id = 'record-indicator'
    indicator.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 20px;
          height: 20px;
          background: red;
          border-radius: 50%;
          animation: blink 1s infinite;
          z-index: 1000;
          box-shadow: 0 0 10px rgba(255,0,0,0.5);
      `

    if (!document.getElementById('blink-style')) {
      const style = document.createElement('style')
      style.id = 'blink-style'
      style.textContent = `
              @keyframes blink {
                  0% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(0.8); }
                  100% { opacity: 1; transform: scale(1); }
              }
          `
      document.head.appendChild(style)
    }

    document.body.appendChild(indicator)
  } else if (!show && indicator) {
    indicator.remove()
  }
}
// Определяем расширение файла на основе MIME типа
const getFileExtension = (blob) => {
  if (blob.type.includes('mp4')) return 'mp4'
  return 'webm'
}

// components/VideoPreview.js
export const createVideoPreview = (blob) => {
  const url = URL.createObjectURL(blob)

  const container = document.createElement('div')
  container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      margin: auto;
      padding: 60px;
      z-index: 1000;
  `

  const video = document.createElement('video')
  video.controls = true
  video.playsInline = true
  video.style.cssText = `
      width: 100%;
      margin: auto;
      border-radius: 10px;
      margin-bottom: 6px;
      background: rgba(0,0,0,0.6);
      padding: 10px;
      border-radius: 20px;
  `
  const playPromise = video.play()
  if (playPromise !== null){
    playPromise.catch(() => { video.play() })
  }

  video.onerror = () => {
    console.error('Video error:', video.error)
    showNotification('Ошибка воспроизведения', 'error')
  }

  video.src = url

  const buttonContainer = document.createElement('div')
  buttonContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 10px;
  `

  const downloadBtn = document.createElement('button')
  downloadBtn.innerHTML = 'Сохранить'
  downloadBtn.style.cssText = `
      flex: 1;
      padding: 12px 32px;
      background: white;
      color: black;
      border: none;
      border-radius: 6px;
      cursor: pointer;
  `
  downloadBtn.onclick = () => {
    const extension = getFileExtension(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AR-Video-${new Date().toISOString()}.${extension}`
    a.click()
  }

  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = 'Закрыть'
  closeBtn.style.cssText = `
      flex: 1;
      padding: 12px 32px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      backdrop-filter: blur(64px);
      -webkit-backdrop-filter: blur(64px);
  `
  closeBtn.onclick = () => {
    container.remove()
    URL.revokeObjectURL(url)
  }

  buttonContainer.appendChild(downloadBtn)
  buttonContainer.appendChild(closeBtn)
  container.appendChild(video)
  container.appendChild(buttonContainer)
  document.body.appendChild(container)
}

// services/MediaRecorder.js
export class MediaRecorderService {
  constructor() {
    this.isRecording = false
    this.recordingStartTime = 0
    this.mediaRecorder = null
    this.recordedChunks = []
    this.videoStream = null
    this.mimeType = null
  }

  getCanvasStream() {

    if (!canvas) {
      throw new Error('Canvas not found')
    }
    return canvas.captureStream(30) // 30 FPS
  }

  async startRecording() {
    if (this.isRecording) {
      console.log('Already recording')
      return
    }

    try {
      this.recordedChunks = []
      this.recordingStartTime = Date.now()

      this.videoStream = this.getCanvasStream()
      console.log('Stream obtained:', this.videoStream)

      this.mimeType = getVideoMimeType()
      console.log('Selected MIME type:', this.mimeType)

      this.mediaRecorder = new MediaRecorder(this.videoStream, {
        mimeType: this.mimeType,
        videoBitsPerSecond: 2500000
      })

      this.setupMediaRecorderEvents()
      this.mediaRecorder.start(1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      showNotification(`Ошибка запуска записи: ${error.message}`, 'error')
      this.isRecording = false
      showRecordingIndicator(false)
    }
  }

  setupMediaRecorderEvents() {
    this.mediaRecorder.ondataavailable = (event) => {
      console.log('Data available:', event.data.size)
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data)
      }
    }

    this.mediaRecorder.onstart = () => {
      console.log('Recording started')
      this.isRecording = true
      document.getElementById('scr-btn').classList.add('recording')
      showNotification('Запись начата')
    }

    this.mediaRecorder.onstop = () => {
      console.log('Recording stopped')
      this.isRecording = false
      document.getElementById('scr-btn').classList.remove('recording')


      if (this.recordedChunks.length === 0) {
        showNotification('Ошибка записи: нет данных', 'error')
        return
      }

      // Используем сохраненный MIME тип при создании Blob
      const blob = new Blob(this.recordedChunks, { type: this.mimeType })
      console.log('Blob created:', blob.size, 'Type:', this.mimeType)


      if (blob.size < 1000) {
        showNotification('Ошибка: файл слишком мал', 'error')
        return
      }

      createVideoPreview(blob)
      showNotification('Запись завершена')

      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop())
        this.videoStream = null
      }
    }

    this.mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error)
      this.isRecording = false
      showRecordingIndicator(false)
      showNotification(`Ошибка записи: ${error.message}`, 'error')
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return

    const recordingDuration = Date.now() - this.recordingStartTime
    console.log('Stopping recording, duration:', recordingDuration)

    if (recordingDuration < 1000) {
      showNotification('Запись слишком короткая', 'error')
      return
    }

    try {
      this.mediaRecorder.stop()
    } catch (error) {
      console.error('Error stopping recording:', error)
      showNotification('Ошибка остановки записи', 'error')
    }
  }
}

// services/Screenshot.js
export const takeARScreenshot = () => {

  if (!canvas) {
    showNotification('Canvas not found', 'error')
    return
  }

  try {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ar-screenshot-${new Date().getTime()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('Screenshot error:', error)
    showNotification('Ошибка при создании скриншота', 'error')
  }
}

// controllers/CaptureController.js
export class CaptureController {
  constructor() {
    this.mediaRecorderService = new MediaRecorderService()
    this.LONG_PRESS_DURATION = 500
  }

  initButtonHandlers() {
    const captureButton = document.getElementById('scr-btn')
    if (!captureButton) {
      console.error('Кнопка захвата не найдена')
      return
    }

    let longPressTimer = null
    let touchMoved = false

    const handleTouchStart = (e) => {
      e.preventDefault()
      touchMoved = false
      captureButton.style.transform = 'scale(0.95)'

      longPressTimer = setTimeout(() => {
        if (!touchMoved) {
          captureButton.style.transform = 'cale(0.9)'
          this.mediaRecorderService.startRecording()
        }
      }, this.LONG_PRESS_DURATION)
    }

    const handleTouchEnd = (e) => {
      e.preventDefault()
      captureButton.style.transform = 'scale(1)'

      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null

        if (!this.mediaRecorderService.isRecording && !touchMoved) {
          takeARScreenshot()
        }
      }

      if (this.mediaRecorderService.isRecording) {
        this.mediaRecorderService.stopRecording()
      }

      touchMoved = false
    }

    const handleTouchMove = (e) => {
      if (!e.touches[0]) return

      const touch = e.touches[0]
      const moveThreshold = 10

      if (!touchMoved) {
        const rect = captureButton.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const distance = Math.sqrt(
            Math.pow(touch.clientX - centerX, 2) +
            Math.pow(touch.clientY - centerY, 2)
        )

        if (distance > moveThreshold) {
          touchMoved = true
          if (longPressTimer) {
            clearTimeout(longPressTimer)
            longPressTimer = null
          }
        }
      }

      e.preventDefault()
    }

    captureButton.removeEventListener('touchstart', handleTouchStart)
    captureButton.removeEventListener('touchend', handleTouchEnd)
    captureButton.removeEventListener('touchmove', handleTouchMove)

    captureButton.addEventListener('touchstart', handleTouchStart, { passive: false })
    captureButton.addEventListener('touchend', handleTouchEnd, { passive: false })
    captureButton.addEventListener('touchmove', handleTouchMove, { passive: false })
  }
}