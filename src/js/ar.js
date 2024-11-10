const imageTargetPipelineModule = () => {
  const modelFile = 'KV_1107.glb'
  const clock = new THREE.Clock()
  const loader = new THREE.GLTFLoader()
  let isRecording = false
  let recordingStartTime = 0
  let model, animations, mixer
  let mediaRecorder = null
  let recordedChunks = []
  let videoStream = null

  const showNotification = (message, type = 'info') => {
    console.log(`[Notification] ${message}`)
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      background: ${type === 'error' ? '#ff4444' : '#44aa44'};
    `
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  // Функция для получения потока с canvas
  const getCanvasStream = () => {
    const canvas = document.getElementById('camerafeed')
    if (!canvas) {
      throw new Error('Canvas not found')
    }
    return canvas.captureStream(30) // 30 FPS
  }

  const startRecording = async () => {
    if (isRecording) {
      console.log('Already recording')
      return
    }

    try {
      recordedChunks = []
      recordingStartTime = Date.now()

      // Получаем поток с canvas
      videoStream = getCanvasStream()
      console.log('Stream obtained:', videoStream)

      // Проверяем поддерживаемые типы
      const mimeType = 'video/webm;codecs=vp9'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('vp9 not supported, trying vp8')
        mimeType = 'video/webm;codecs=vp8'
      }

      // Создаем MediaRecorder
      mediaRecorder = new MediaRecorder(videoStream, {
        mimeType,
        videoBitsPerSecond: 2500000
      })

      console.log('MediaRecorder created:', mediaRecorder)

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size)
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data)
        }
      }

      mediaRecorder.onstart = () => {
        console.log('Recording started')
        isRecording = true
        showRecordingIndicator(true)
        showNotification('Запись начата')
      }

      mediaRecorder.onstop = () => {
        console.log('Recording stopped')
        isRecording = false
        showRecordingIndicator(false)

        if (recordedChunks.length === 0) {
          showNotification('Ошибка записи: нет данных', 'error')
          return
        }

        const blob = new Blob(recordedChunks, { type: 'video/webm' })
        console.log('Blob created:', blob.size)

        if (blob.size < 1000) {
          showNotification('Ошибка: файл слишком мал', 'error')
          return
        }

        createVideoPreview(blob)
        showNotification('Запись завершена')

        // Очищаем ресурсы
        if (videoStream) {
          videoStream.getTracks().forEach(track => track.stop())
          videoStream = null
        }
      }

      mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error)
        isRecording = false
        showRecordingIndicator(false)
        showNotification(`Ошибка записи: ${error.message}`, 'error')
      }

      // Начинаем запись
      mediaRecorder.start(1000) // Получаем чанки каждую секунду

    } catch (error) {
      console.error('Error starting recording:', error)
      showNotification(`Ошибка запуска записи: ${error.message}`, 'error')
      isRecording = false
      showRecordingIndicator(false)
    }
  }

  const stopRecording = () => {
    if (!isRecording || !mediaRecorder) return

    const recordingDuration = Date.now() - recordingStartTime
    console.log('Stopping recording, duration:', recordingDuration)

    if (recordingDuration < 1000) {
      showNotification('Запись слишком короткая', 'error')
      return
    }

    try {
      mediaRecorder.stop()
    } catch (error) {
      console.error('Error stopping recording:', error)
      showNotification('Ошибка остановки записи', 'error')
    }
  }

  const createVideoPreview = (blob) => {
    const url = URL.createObjectURL(blob)

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 10px;
      border-radius: 10px;
      z-index: 1000;
    `

    const video = document.createElement('video')
    video.controls = true
    video.style.cssText = `
      width: 200px;
      border-radius: 5px;
      margin-bottom: 10px;
    `

    // Добавляем обработчики событий для отладки
    video.onloadedmetadata = () => {
      console.log('Video metadata:', {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      })
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
    downloadBtn.innerHTML = 'Скачать'
    downloadBtn.style.cssText = `
      flex: 1;
      padding: 8px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    `
    downloadBtn.onclick = () => {
      const a = document.createElement('a')
      a.href = url
      a.download = `AR-Video-${new Date().toISOString()}.webm`
      a.click()
    }

    const closeBtn = document.createElement('button')
    closeBtn.innerHTML = 'Закрыть'
    closeBtn.style.cssText = `
      flex: 1;
      padding: 8px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
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

  const showRecordingIndicator = (show) => {
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

  // Остальные функции остаются без изменений
  const takeARScreenshot = () => {
    const canvas = document.getElementById('camerafeed')
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

  // Инициализация обработчиков кнопки
  const initButtonHandlers = () => {
    const captureButton = document.getElementById('scr-btn')
    if (!captureButton) {
      console.error('Кнопка захвата не найдена')
      return
    }

    let longPressTimer = null
    let touchMoved = false
    const LONG_PRESS_DURATION = 500

    const handleTouchStart = (e) => {
      e.preventDefault()
      touchMoved = false
      captureButton.style.transform = 'scale(0.95)'

      longPressTimer = setTimeout(() => {
        if (!touchMoved) {
          captureButton.style.transform = 'scale(0.9)'
          startRecording()
        }
      }, LONG_PRESS_DURATION)
    }

    const handleTouchEnd = (e) => {
      e.preventDefault()
      captureButton.style.transform = 'scale(1)'

      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null

        if (!isRecording && !touchMoved) {
          takeARScreenshot()
        }
      }

      if (isRecording) {
        stopRecording()
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

  // Scene initialization remains the same
  const initXrScene = ({ scene, camera }) => {
    initButtonHandlers()

    loader.load(
      modelFile,
      (gltf) => {
        model = gltf.scene
        scene.add(model)
        model.visible = false

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model)
          gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play()
          })
        }
      }
    )

    scene.add(new THREE.AmbientLight(0x404040, 5))
    camera.position.set(0, 3, 0)
  }

  // Target visibility handlers remain the same
  const showTarget = ({ detail }) => {
    if (detail.name === 'qr-target') {
      model.position.copy(detail.position)
      model.quaternion.copy(detail.rotation)
      model.scale.set(detail.scale, detail.scale, detail.scale)
      model.visible = true
    }
  }

  const hideTarget = ({ detail }) => {
    if (detail.name === 'qr-target') {
      model.visible = false
    }
  }

  // Return the module interface
  return {
    name: 'threejs-flyer',
    onStart: ({ canvas }) => {
      const { scene, camera } = XR8.Threejs.xrScene()
      initXrScene({ scene, camera })

      canvas.addEventListener('touchmove', (event) => {
        event.preventDefault()
      })

      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    },
    onUpdate: () => {
      const delta = clock.getDelta()
      if (mixer) {
        mixer.update(delta)
      }
    },
    listeners: [
      { event: 'reality.imagefound', process: showTarget },
      { event: 'reality.imageupdated', process: showTarget },
      { event: 'reality.imagelost', process: hideTarget },
    ],
  }
}

const onxrloaded = () => {
  XR8.XrController.configure({ disableWorldTracking: true })
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    XRExtras.AlmostThere.pipelineModule(),
    XRExtras.FullWindowCanvas.pipelineModule(),
    XRExtras.Loading.pipelineModule(),
    XRExtras.RuntimeError.pipelineModule(),
    XR8.CanvasScreenshot.pipelineModule(),
    XR8.MediaRecorder.pipelineModule(),
    imageTargetPipelineModule(),
  ])

  XR8.run({ canvas: document.getElementById('camerafeed') })
}

const load = () => { XRExtras.Loading.showLoading({ onxrloaded }) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }