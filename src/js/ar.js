import * as THREE from 'three'

import { loaderGLB } from './core/loaders.js'
import { particleMaterial } from './core/materials.js'
import { ParticleSystem } from './core/particleSystem.js'
import { ambientLight, pointLight, directionalLight } from './core/lights.js'
// import { CaptureController } from './utils/screenCapture.js'
import { EffectComposer } from './three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from './three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './three/addons/postprocessing/UnrealBloomPass.js'

window.THREE = THREE
// Создаем композер и пассы

// Constants
const particleSystemInstance = new ParticleSystem()
const FRAME_RATE = 1000 / 60
const clock = new THREE.Clock()
const mixers = []

let lastTime = performance.now()
let sceneOne, sceneTwo

let width
let height


const setupBloomMaterial = (object) => {
  object.traverse((child) => {
    if (child.isMesh) {
      const material = child.material
      if (material) {
        // Базовые настройки для блума
        material.toneMapped = false
        material.transparent = true

        // Настраиваем эмиссию
        if (material.emissive) {
          material.emissive.setRGB(1, 1, 1)
          material.emissiveIntensity = 1
        }

        // Увеличиваем яркость базового цвета
        material.color.multiplyScalar(2)

        // Обновляем материал
        material.needsUpdate = true
      }
    }
  })
}

const sceneGroup = new THREE.Group()
const imageTargetPipelineModule = () => {

  let scene3
  let isSetup = false
  let composer
  let bloomPass


  const params = {
    exposure: 1,
    strength: 1.5,
    threshold: 0.2,
    radius: 0,
  }

  const xrScene = () => scene3

  const trySetup = ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
    if (isSetup) return
    isSetup = true


    width = canvasWidth
    height = canvasHeight

    // const pixelRatio = THREE.MathUtils.clamp(window.devicePixelRatio, 1, 2)
    // const renderWidth = canvasWidth * pixelRatio
    // const renderHeight = canvasHeight * pixelRatio

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60.0 /* initial field of view; will get set based on device info later. */,
      canvasWidth / canvasHeight,
      0.01,
      1000
    )
    scene.add(camera)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: GLctx,
      alpha: true,
      antialias: true,
    })
    renderer.debug.checkShaderErrors = false  // speeds up loading new materials
    renderer.autoClear = true
    // renderer.autoClearDepth = false
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = params.exposure
    renderer.setSize(canvasWidth, canvasHeight)
    // renderer.setPixelRatio(pixelRatio)


    // Bloom Composer
    composer = new EffectComposer(renderer)

    // Основной проход рендеринга
    const renderPass = new RenderPass(scene, camera)
    renderPass.clear = true // Важно для AR
    composer.addPass(renderPass)


    // Настраиваем блум
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      params.strength,
      params.radius,
      params.threshold
    )

    bloomPass.clearColor = new THREE.Color(0x000000)
    bloomPass.renderToScreen = true // Важно для финального рендера
    composer.addPass(bloomPass)


    scene3 = {
      scene,
      camera,
      renderer,
      composer
    }
    // Инициализируем сцену после создания всех необходимых объектов
    initXrScene(scene3)

    window.scene3 = scene3
    window.XR8.Threejs.xrScene = xrScene

    scene.traverse((object) => {
      if (object.isMesh) {
        const material = object.material
        if (material) {
          material.toneMapped = false // Важно для блума
        }
      }
    })

    // Отладочная информация
    console.log('Scene setup completed', {
      sceneChildren: scene.children.length,
      composerPasses: composer.passes.length,
      rendererInfo: renderer.info
    })
  }

  // Target visibility handlers remain the same
  const showTarget = ({ detail }) => {
    if (detail.name === 'qr-target') {
      sceneGroup.position.copy(detail.position)
      sceneGroup.quaternion.copy(detail.rotation)
      sceneGroup.scale.set(detail.scale, detail.scale, detail.scale)
      sceneGroup.visible = true
    }
  }

  const hideTarget = ({ detail }) => {
    if (detail.name === 'qr-target') {
      sceneGroup.visible = false
    }
  }

  return {
    name: 'customthreejs',
    onStart: args => trySetup(args),
    onDetach: () => {
      isSetup = false
    },
    onCanvasSizeChange: ({ canvasWidth, canvasHeight }) => {
      if (!isSetup) return

      const { renderer, composer } = scene3

      // Обновляем размеры
      renderer.setSize(canvasWidth, canvasHeight)
      composer.setSize(canvasWidth, canvasHeight)

      // Обновляем параметры блума
      if (bloomPass) {
        bloomPass.resolution.set(canvasWidth, canvasHeight)
      }
    },
    onUpdate: ({ processCpuResult }) => {

      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      if (deltaTime > FRAME_RATE) {
        const delta = clock.getDelta()
        mixers.forEach(mixer => mixer.update(delta))
        particleSystemInstance.update(delta)
        particleMaterial.uniforms.time.value = clock.getElapsedTime()

        //renderer.render(scene, camera)
        lastTime = currentTime
      }

    },
    onRender: () => {
      if (!isSetup) return

      const { renderer, composer } = scene3

      // Очищаем буфер перед рендерингом
      renderer.clear()

      // Рендерим через композер
      composer.render()
    },
    // Get a handle to the xr scene, camera, renderer, and composers
    xrScene,
    listeners: [
      { event: 'reality.imagefound', process: showTarget },
      { event: 'reality.imageupdated', process: showTarget },
      { event: 'reality.imagelost', process: hideTarget },
    ],
  }
}


// Initialization
const initXrScene = ({ scene, camera }) => {

  scene.add(ambientLight, pointLight, directionalLight)
  camera.position.set(0, 3, 0)
  // const captureController = new CaptureController()
  // captureController.initButtonHandlers()
  loaderGLB.load('/assets/models/BG.glb', (gltf) => {

    const mainMesh = gltf.scene
    setupBloomMaterial(mainMesh)
    sceneGroup.add(mainMesh)
    mainMesh.visible = false

    if (gltf.animations && gltf.animations.length > 0) {
      console.log('Found animations:', gltf.animations)
      const mixer = new THREE.AnimationMixer(mainMesh)

      gltf.animations.forEach((clip) => {
        console.log('Playing animation:', clip.name)
        const action = mixer.clipAction(clip)
        action.play()
      })

      // Добавляем mixer в массив или объект для обновления
      // Например, можно создать массив mixers в начале файла
      mixers.push(mixer)
    }

    const particleSystem = particleSystemInstance.createFromMesh(gltf.scene)
    if (particleSystem) {
      sceneGroup.add(particleSystem)
      particleSystem.scale.set(1.2, 1.2, 1.2)
    }
  })
  loaderGLB.load('/assets/models/KV.glb', (gltf) => {

    sceneOne = gltf.scene
    sceneGroup.add(sceneOne)
    // sceneOne.traverse(function (child) {

    //     if (child.name === 'Circle-Particle') {
    //         circleParticle = child
    //     }

    // })



    if (gltf.animations && gltf.animations.length > 0) {
      console.log('Found animations:', gltf.animations)
      const mixer = new THREE.AnimationMixer(sceneOne)

      gltf.animations.forEach((clip) => {
        console.log('Playing animation:', clip.name)
        const action = mixer.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1) // Проиграть только один раз
        action.clampWhenFinished = true // Оставить анимацию в последнем кадре
        action.play()
      })

      // Добавляем mixer в массив или объект для обновления
      // Например, можно создать массив mixers в начале файла
      mixers.push(mixer)
    }

  })
  loaderGLB.load('/assets/models/Planets.glb', (gltf) => {
    sceneTwo = gltf.scene
    setupBloomMaterial(sceneTwo)
    sceneGroup.add(sceneTwo)
    // sceneTwo.traverse((child) => {
    //     if (child.isMesh && child.material) {

    //     }
    // })
    sceneTwo.position.y = 2.5
    sceneTwo.scale.set(0.45, 0.45, 0.45)

    if (gltf.animations && gltf.animations.length > 0) {
      console.log('Found animations:', gltf.animations)
      const mixer = new THREE.AnimationMixer(sceneTwo)

      gltf.animations.forEach((clip) => {
        console.log('Playing animation:', clip.name)
        const action = mixer.clipAction(clip)
        action.play()
      })

      // Добавляем mixer в массив или объект для обновления
      // Например, можно создать массив mixers в начале файла
      mixers.push(mixer)
    }

  })

  scene.add(sceneGroup)
  sceneGroup.visible = false
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
  // Add a canvas to the document for our xr scene.

  const canvas = document.getElementById('camerafeed')
  XR8.run({ canvas: canvas })
}

const load = () => { XRExtras.Loading.showLoading({ onxrloaded }) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }

