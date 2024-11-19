import * as THREE from 'three'
import { loaderGLB, loaderRGBE } from './core/loaders.js'
import { CaptureController } from './utils/screenCapture.js'
import { ambientLight, pointLight, directionalLight } from './core/lights.js'

window.THREE = THREE

let lastTime = performance.now()

const FRAME_RATE = 1000 / 60
const clock = new THREE.Clock()
const mixers = []

let hdriMap
let sceneOne
let sceneOneAnimations
let sceneOneAnimationMixer
const sceneGroup = new THREE.Group()
// const particlesGroup = new THREE.Group()
sceneGroup.visible = false
// Система частиц
// const sparkles = []
// const sparklesGeometry = new THREE.BufferGeometry()
// const sparklesMaterial = new THREE.ShaderMaterial({
//   uniforms: {
//     pointTexture: {
//       value: new THREE.TextureLoader().load('/assets/dotTexture.png')
//     },
//     time: { value: 0 }
//   },
//   vertexShader: `
//     attribute float size;
//     attribute vec3 color;
//     varying vec3 vColor;
//     uniform float time;

//     void main() {
//         vColor = color;
//         vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

//         // Улучшенное мерцание с разными частотами
//         float flutter = sin(time * 2.0 + position.x * 10.0) * 0.3 + 
//                       sin(time * 1.5 + position.y * 8.0) * 0.3 +
//                       sin(time * 1.0 + position.z * 6.0) * 0.4;

//         float dist = -mvPosition.z;
//         float sizeScale = clamp(300.0 / dist, 5.0, 15.0);

//         gl_PointSize = size * sizeScale * (0.7 + 0.3 * flutter);
//         gl_Position = projectionMatrix * mvPosition;
//     }
//   `,
//   fragmentShader: `
//     uniform sampler2D pointTexture;
//     varying vec3 vColor;

//     void main() {
//       vec4 texColor = texture2D(pointTexture, gl_PointCoord);
//       gl_FragColor = vec4(vColor, texColor.a);
//     }
//   `,
//   depthTest: false,
//   depthWrite: false,
//   blending: THREE.AdditiveBlending,
//   transparent: true,
// });


//sceneGroup.add(particlesGroup)
// Флаг инициализации системы частиц
//let particlesInitialized = false
let modelLoaded = false

//let myMesh = null

// class Sparkle extends THREE.Vector3 {
//   constructor() {
//     super()
//     this.size = Math.random() * 1.0 + 0.5
//     this.originalY = 0
//     this.speed = Math.random() * 0.02 + 0.01
//     this.angle = Math.random() * Math.PI * 2
//     this.orbitSpeed = (Math.random() * 0.2 + 0.1) * (Math.random() < 0.5 ? 1 : -1)
//     this.orbitRadius = Math.random() * 0.5 + 1
//     this.phaseOffset = Math.random() * Math.PI * 2
//   }

//   setup() {
//     const radius = 1.2
//     const theta = Math.random() * Math.PI * 2
//     const phi = Math.random() * Math.PI * 2

//     this.x = radius * Math.sin(theta) * Math.cos(phi)
//     this.y = radius * Math.sin(theta) * Math.sin(phi)
//     this.z = radius * Math.cos(theta)

//     this.originalY = this.y
//   }

//   update(time) {
//     // Обновляем угол для орбитального движения
//     this.angle += this.orbitSpeed * 0.01

//     // Рассчитываем новую позицию с учетом орбитального движения
//     const orbitX = Math.cos(this.angle) * this.orbitRadius
//     const orbitZ = Math.sin(this.angle) * this.orbitRadius

//     // Добавляем волнообразное движение по Y с учетом фазового смещения
//     this.x = orbitX
//     this.y = this.originalY + Math.sin(time * this.speed + this.phaseOffset) * 0.2
//     this.z = orbitZ
//   }
// }

function initLoader() {
  loadTextures()
  loaderGLB.load('/assets/models/Logo_1113.glb', (gltf) => {
    sceneOne = gltf.scene
    sceneGroup.add(sceneOne)
    if (gltf.animations && gltf.animations.length > 0) {
      sceneOneAnimationMixer = new THREE.AnimationMixer(sceneOne)
      sceneOneAnimations = gltf.animations

      mixers.push(sceneOneAnimationMixer)
    }
    // myMesh = gltf.scene.children[1]
    // sceneGroup.add(myMesh)
    // initParticles()
  })
}
// function initParticles() {
//   const particleCount = 200
//   // Очищаем предыдущие частицы, если они есть
//   sparkles.length = 0;
//   for (let i = 0; i < particleCount; i++) {
//     const spark = new Sparkle()
//     spark.setup()
//     sparkles.push(spark)
//   }

//   const colors = new Float32Array(particleCount * 3)
//   const sizes = new Float32Array(particleCount)
//   const positions = new Float32Array(particleCount * 3)

//   for (let i = 0; i < particleCount; i++) {
//     const color = new THREE.Color(0xFFF0AC)
//     color.multiplyScalar(0.7)

//     colors[i * 3] = color.r
//     colors[i * 3 + 1] = color.g
//     colors[i * 3 + 2] = color.b

//     sizes[i] = sparkles[i].size

//     positions[i * 3] = sparkles[i].x
//     positions[i * 3 + 1] = sparkles[i].y
//     positions[i * 3 + 2] = sparkles[i].z
//   }

//   sparklesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
//   sparklesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
//   sparklesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
//   const points = new THREE.Points(sparklesGeometry, sparklesMaterial)

//   points.frustumCulled = false
//   points.renderOrder = 999 // Устанавливаем высокий renderOrder для объекта точек
//   particlesGroup.add(points)
//   particlesInitialized = true
// }

const imageTargetPipelineModule = () => {
  let hasPlayedAnimation = false;
  const showTarget = ({ detail }) => {
    if (detail.name === 'qr-target') {
      sceneGroup.position.copy(detail.position)
      sceneGroup.quaternion.copy(detail.rotation)
      sceneGroup.scale.set(detail.scale, detail.scale, detail.scale)
      sceneGroup.visible = true
      if (sceneOneAnimations && sceneOneAnimationMixer && !hasPlayedAnimation) {
        hasPlayedAnimation = true; // Отмечаем, что анимация запущена

        sceneOneAnimations.forEach((clip) => {
          const action = sceneOneAnimationMixer.clipAction(clip)
          action.setLoop(THREE.LoopOnce, 1)
          action.clampWhenFinished = true
          action.play()
        })
      }
    }
  }

  const hideTarget = ({ detail }) => {
    if (detail.name === 'qr-target') {
      sceneGroup.visible = false
    }
  }

  return {
    name: 'metropol-2211',
    onStart: ({ canvas }) => {
      window.canvas = canvas
      const { scene, camera } = XR8.Threejs.xrScene()
      camera.near = 0.01
      camera.far = 1000
      camera.updateProjectionMatrix()
      scene.environment = hdriMap
      scene.add(ambientLight, pointLight, directionalLight)

      initLoader()
      const captureController = new CaptureController()
      captureController.initButtonHandlers()
      scene.add(sceneGroup)


      canvas.addEventListener('touchmove', (event) => {
        event.preventDefault()
      })

      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    },
    onUpdate: ({ processCpuResult }) => {
      // if (!particlesInitialized || !modelLoaded) {
      //   return
      // }
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      if (deltaTime > FRAME_RATE) {
        const time = clock.getElapsedTime()
        const delta = clock.getDelta()
        mixers.forEach(mixer => mixer.update(delta))
        //     sparklesMaterial.uniforms.time.value = time

        // Обновление позиций частиц
        //  const positions = sparklesGeometry.attributes.position.array
        // for (let i = 0; i < sparkles.length; i++) {
        //   const spark = sparkles[i]
        //   spark.update(time)

        //   positions[i * 3] = spark.x
        //   positions[i * 3 + 1] = spark.y
        //   positions[i * 3 + 2] = spark.z
        // }
        // sparklesGeometry.attributes.position.needsUpdate = true

        // Вращение группы для лучшего 3D эффекта
        //sceneGroup.rotation.y += 0.002

        lastTime = currentTime
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
    imageTargetPipelineModule(),
  ])

  const canvas = document.getElementById('camerafeed')
  XR8.run({ canvas: canvas })
}

function loadTextures() {
  loaderRGBE.setPath('/textures/')
    .load('quarry_01_1k.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping
      hdriMap = texture
    })
}

const load = () => { XRExtras.Loading.showLoading({ onxrloaded }) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }