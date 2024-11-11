import * as THREE from 'three'

import { loaderGLB, loaderRGBE } from './core/loaders.js'
//import { particleMaterial } from './core/materials.js'
//import { ParticleSystem } from './core/particleSystem.js'
import { ambientLight, pointLight, directionalLight } from './core/lights.js'
// import { CaptureController } from './utils/screenCapture.js'


window.THREE = THREE

// Constants
//const particleSystemInstance = new ParticleSystem()
const FRAME_RATE = 1000 / 60
const clock = new THREE.Clock()
const mixers = []
let lastTime = performance.now()
let sceneOne, sceneTwo, hdriMap
let sceneOneAnimations, sceneTwoAnimations
let sceneOneAnimationMixer, sceneTwoAnimationMixer
let bgAnimationMixer
const sceneGroup = new THREE.Group()
// Создаем таймлайны на верхнем уровне
const fadeInTimeline = gsap.timeline({
    defaults: { duration: 1.2, ease: "power2.inOut" }
})


const imageTargetPipelineModule = () => {
    ////////////////////////////////////////////////////////////////
    let hasPlayedAnimation = false; // Флаг, что анимация была воспроизведена

    const showTarget = ({ detail }) => {
        if (detail.name === 'qr-target') {
            sceneGroup.position.copy(detail.position)
            sceneGroup.quaternion.copy(detail.rotation)
            sceneGroup.scale.set(detail.scale, detail.scale, detail.scale)
            sceneGroup.visible = true

            fadeOnPlanets()
            // fadeInTimeline.to(particleMaterial, {
            //     opacity: 1,
            //     duration: 2
            // }, 3.6)
            // fadeInTimeline.to(particleMaterial, {
            //     opacity: 0,
            //     duration: 2
            // }, 10)
            // Запускаем анимацию только если она еще не была воспроизведена
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

    ////////////////////////////////////////////////////////////////
    return {
        name: 'metropol-2211',
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
            const currentTime = performance.now()
            const deltaTime = currentTime - lastTime

            if (deltaTime > FRAME_RATE) {
                const delta = clock.getDelta()
                mixers.forEach(mixer => mixer.update(delta))
                // particleSystemInstance.update(delta)
                // particleMaterial.uniforms.time.value = clock.getElapsedTime()

                //renderer.render(scene, camera)
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

////////////////////////////////////////////////////////////////
// Initialization
const initXrScene = ({ scene, camera }) => {
    loadTextures()
    scene.environment = hdriMap
    scene.add(ambientLight, pointLight, directionalLight)
    camera.position.set(0, 3, 0)
    // const captureController = new CaptureController()
    // captureController.initButtonHandlers()
    // loaderGLB.load('/assets/models/BG.glb', (gltf) => {

    //     const bgMesh = gltf.scene

    //     sceneGroup.add(bgMesh)
    //     bgMesh.visible = false

    //     if (gltf.animations && gltf.animations.length > 0) {

    //         bgAnimationMixer = new THREE.AnimationMixer(bgMesh)

    //         gltf.animations.forEach((clip) => {

    //             const action = bgAnimationMixer.clipAction(clip)
    //             action.play()
    //         })

    //         mixers.push(bgAnimationMixer)
    //     }

    //     const particleSystem = particleSystemInstance.createFromMesh(gltf.scene)
    //     if (particleSystem) {
    //         //particleSystem.rotation.x = Math.PI / 2
    //         //particleSystem.position.z = - 2
    //         sceneGroup.add(particleSystem)
    //         particleMaterial.opacity = 0

    //     }
    // })

    loaderGLB.load('/assets/models/KV.glb', (gltf) => {

        sceneOne = gltf.scene
        sceneOne.position.set(0, 0.25, 0)
        sceneOne.scale.set(0.8, 0.8, 0.8)
        sceneGroup.add(sceneOne)
        sceneOne.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.envMap = hdriMap
            }
        })


        if (gltf.animations && gltf.animations.length > 0) {
            sceneOneAnimationMixer = new THREE.AnimationMixer(sceneOne)
            sceneOneAnimations = gltf.animations

            mixers.push(sceneOneAnimationMixer)
        }
    })
    loaderGLB.load('/assets/models/Planets.glb', (gltf) => {

        sceneTwo = gltf.scene
        sceneGroup.add(sceneTwo)

        sceneTwo.scale.set(0, 0, 0) // Начальный масштаб 0
        sceneTwo.position.set(0, -1, 0) // Начальная позиция ниже
        //sceneTwo.rotation.x = Math.PI / 2

        sceneTwo.traverse((child) => {
            if (child.isMesh) {
                child.material.transparent = true
                child.material.opacity = 0
            }
        })
        if (gltf.animations && gltf.animations.length > 0) {

            sceneTwoAnimationMixer = new THREE.AnimationMixer(sceneTwo)
            sceneTwoAnimations = gltf.animations
            sceneTwoAnimations.forEach((clip) => {

                const action = sceneTwoAnimationMixer.clipAction(clip)
                action.play()
            })


            mixers.push(sceneTwoAnimationMixer)
        }

    })

    scene.add(sceneGroup)
    sceneGroup.visible = false
}
////////////////////////////////////////////////////////////////
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


    const canvas = document.getElementById('camerafeed')
    XR8.run({ canvas: canvas })
}
////////////////////////////////////////////////////////////////
function loadTextures() {
    loaderRGBE.setPath('/textures/')
        .load('quarry_01_1k.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping
            hdriMap = texture
        })
}
function fadeOnPlanets() {
    fadeInTimeline.clear()
    if (sceneTwo) {
        // Анимация позиции и масштаба
        fadeInTimeline.to(sceneTwo.position, {
            y: 1.5,
            duration: 3,
            ease: "power2.out"
        }, 11)

        fadeInTimeline.to(sceneTwo.scale, {
            x: 0.45,
            y: 0.45,
            z: 0.45,
            duration: 3,
            ease: "elastic.out(1, 0.75)"
        }, 11)

        // Анимация прозрачности
        sceneTwo.traverse((child) => {
            if (child.isMesh) {
                fadeInTimeline.to(child.material, {
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.inOut"
                }, 11.5)
            }
        })
    }
}
////////////////////////////////////////////////////////////////
const load = () => { XRExtras.Loading.showLoading({ onxrloaded }) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }

