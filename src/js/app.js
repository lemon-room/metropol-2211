import * as THREE from 'three'
import { loaderGLB, loaderRGBE } from './core/loaders.js'
import { particleMaterial } from './core/materials.js'
import { SparklesSystem } from './core/sparcles.js'
import { CaptureController } from './utils/screenCapture.js'
import { ambientLight, pointLight, directionalLight } from './core/lights.js'

window.THREE = THREE

const clock = new THREE.Clock()
let lastTime = performance.now()
const mixers = []

let hdriMap
let sceneOne, sceneTwo, kVisualBG
let sceneOneAnimations, sceneTwoAnimations ,kVisualBGAnimations
let sceneOneAnimationMixer, sceneTwoAnimationMixer, kVisualBGAnimationMixer
let modelsLoaded = false

const sceneGroup = new THREE.Group()
const showContainerGroup = new THREE.Group()

showContainerGroup.visible = false
let sparclsMesh = null

const textureLoader = new THREE.TextureLoader()
const sparklesSystem = new SparklesSystem()


// let flag
// let flagGeometry
// let flagMaterial


const fadeInTimeline = gsap.timeline({
    defaults: { duration: 1.2, ease: "power2.inOut" }
})
const fadeOutTimeline = gsap.timeline({
    defaults: { duration: 1.2, ease: "power2.inOut" }
})


const loadModels = () => {
    const sceneOneLoad = new Promise((resolve, reject) => {
        loaderGLB.load('/assets/models/Logo_1113-transformed.glb', (gltf) => {
            sceneOne = gltf.scene
            sparclsMesh = gltf.scene.children[1]

            sceneOne.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMap = hdriMap
                }
            })
            if (gltf.animations && gltf.animations.length > 0) {
                sceneOneAnimationMixer = new THREE.AnimationMixer(sceneOne)
                sceneOneAnimations = gltf.animations
            }
            resolve()
        }, undefined, (error) => {
            console.error('Error loading scene1:', error)
            reject(error)
        })
    })

    const sceneTwoLoad = new Promise((resolve, reject) => {
        loaderGLB.load('/assets/models/Planets.glb', (gltf) => {
            sceneTwo = gltf.scene
            sceneTwo.scale.set(0, 0, 0)
            sceneTwo.position.set(0, 0.35, 0)
            sceneTwo.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMap = hdriMap
                    child.material.transparent = true
                    child.material.opacity = 0
                }
            })
            if (gltf.animations && gltf.animations.length > 0) {
                // Настройка анимаций
                sceneTwoAnimationMixer = new THREE.AnimationMixer(sceneTwo)
                sceneTwoAnimations = gltf.animations
            }
            resolve()
        }, undefined, (error) => {
            console.error('Error loading scene1:', error)
            reject(error)
        })
    })

    const kVisualBGLoad = new Promise((resolve, reject) => {
        loaderGLB.load('/assets/models/BG-TEST-separated-transformed.glb', (gltf) => {
            kVisualBG = gltf.scene
            kVisualBG.scale.set(1.3, 1.3, 1.3)
            kVisualBG.position.set(0, 0.45, 0)
            kVisualBG.traverse((child) => {
                if (child.isMesh) {
                    child.frustumCulled = false
                    child.material.envMap = hdriMap
                    child.material.transparent = true
                    child.material.opacity = 1
                }
            })
            if (gltf.animations && gltf.animations.length > 0) {
                kVisualBGAnimationMixer = new THREE.AnimationMixer(kVisualBG)
                kVisualBGAnimations = gltf.animations

            }
            resolve()
        }, undefined, (error) => {
            console.error('Error loading scene1:', error)
            reject(error)
        })
    })

    return Promise.all([sceneOneLoad, sceneTwoLoad, kVisualBGLoad])
}

const loadTextures = () => {
    const hdriLoad = new Promise((resolve, reject) => {
        loaderRGBE.setPath('/textures/')
            .load('Jewelry-HDRI-black-contrast.hdr', function (texture) {
                texture.mapping = THREE.EquirectangularReflectionMapping
                hdriMap = texture
                resolve()
            }, undefined, (error) => {
                console.error('Error loading HDRI:', error)
                reject(error)
            })
    })

    return Promise.all([hdriLoad])
}


const initLoader = async () => {
    await loadTextures()
    await loadModels()

    // createFlag()

    mixers.push(sceneOneAnimationMixer)
    mixers.push(sceneTwoAnimationMixer)
    mixers.push(kVisualBGAnimationMixer)

    modelsLoaded = true

    sceneGroup.add(sceneOne)
    sceneGroup.add(sceneTwo)
    sceneGroup.add(kVisualBG)
}

function fadeOnPlanets() {

    if (kVisualBG) {
        kVisualBG.traverse((child) => {
            if (child.isMesh) {
                // fadeInTimeline.to(child.material, {
                //     opacity: 1,
                //     duration: 2.6,
                //     ease: "power2.inOut"
                // }, 1.2)
                fadeOutTimeline.to(child.material, {
                    opacity: 0,
                    duration: 2.6,
                    ease: "power2.inOut"
                }, 8)
            }
        })
    }

    if (sceneOne) {

        fadeInTimeline.to(particleMaterial.uniforms.uOpacity, {
            value: 1,
            duration: 2
        }, 2)
        // fadeInTimeline.to(flagMaterial.uniforms.uOpacity, {
        //     value: 1,
        //     duration: 1
        // }, 3)
        // fadeOutTimeline.to(particleMaterial.uniforms.uOpacity, {
        //     value: 0,
        //     duration: 2
        // }, 10)
        // fadeOutTimeline.to(flagMaterial.uniforms.uOpacity, {
        //     value: 0,
        //     duration: 2
        // }, 11)
    }

    if (sceneTwo) {

        fadeInTimeline.to(sceneTwo.position, {
            y: 1,
            duration: 2.5,
            ease: "power2.out",
            onStart: () => console.log("Position animation started"),
        }, 12)


        fadeInTimeline.to(sceneTwo.scale, {
            x: 0.35,
            y: 0.35,
            z: 0.35,
            duration: 2.5,
            ease: "elastic.out(1, 0.75)",
            onStart: () => console.log("Scale animation started"),
        }, 12)


        sceneTwo.traverse((child) => {
            if (child.isMesh) {
                fadeInTimeline.to(child.material, {
                    opacity: 1,
                    duration: 2.6,
                    ease: "power2.inOut"
                }, 10.6)
            }
        })
    }
}

// function createFlag() {
//     textureLoader.load(
//         '/assets/background-UPSCALED.png',
//         (texture) => {
//             flagGeometry = new THREE.PlaneGeometry(2, 1, 32, 16)
//             flagMaterial = new THREE.ShaderMaterial({
//                 uniforms: {
//                     uOpacity: { value: 0 },
//                     time: { value: 0 },
//                     flagTexture: { value: texture }
//                 },
//                 vertexShader: `
//           uniform float time;
//           varying vec2 vUv;
//
//           void main() {
//             vUv = uv;
//             vec3 pos = position;
//             float wave = sin(pos.x * 3.0 + time * 2.0) * 0.1;
//             pos.z += wave * pos.x;
//             gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
//           }
//         `,
//                 fragmentShader: `
//           uniform float uOpacity;
//           uniform sampler2D flagTexture;
//           varying vec2 vUv;
//
//           void main() {
//             vec4 texColor = texture2D(flagTexture, vUv);
//             float shade = 0.8 + 0.2 * sin(vUv.x * 10.0);
//             gl_FragColor = texColor * vec4(vec3(shade), 1.0 * uOpacity);
//           }
//         `,
//                 side: THREE.DoubleSide,
//                 transparent: true
//             })
//
//             flag = new THREE.Mesh(flagGeometry, flagMaterial)
//             flag.scale.set(3,3,3)
//             flag.position.y = 0.75
//             flag.position.z = -1.5
//             sceneGroup.add(flag)
//
//         },
//         undefined,
//         (error) => {
//             console.error('Ошибка загрузки текстуры:', error)
//         }
//     )
// }


// sceneGroup.add(particlesGroup)


const imageTargetPipelineModule = () => {
    let hasPlayedAnimation = false
    // const resetAndPlayAnimation = () => {
    //     if (sceneOneAnimations && sceneOneAnimationMixer) {
    //         // Stop all current animations
    //         sceneOneAnimationMixer.stopAllAction()
    //
    //         console.log('Playing animations')
    //         sceneOneAnimations.forEach((clip) => {
    //             const action = sceneOneAnimationMixer.clipAction(clip)
    //             console.log('Playing animation clip:', clip.name)
    //             action.setLoop(THREE.LoopOnce, 1)
    //             action.clampWhenFinished = true
    //             action.play()
    //         })
    //         sceneTwoAnimations.forEach(clip => {
    //             const action = sceneTwoAnimationMixer.clipAction(clip)
    //             action.play()
    //         })
    //     } else {
    //         console.warn('Animations or mixer not ready')
    //     }
    //
    // }


    const showTarget = ({ detail }) => {
        if (detail.name === 'qr-target') {
            showContainerGroup.position.copy(detail.position)
            showContainerGroup.quaternion.copy(detail.rotation)
            showContainerGroup.scale.set(detail.scale, detail.scale, detail.scale)
            showContainerGroup.visible = true


            if (!hasPlayedAnimation && modelsLoaded && sceneOneAnimations && sceneTwoAnimations && kVisualBGAnimations) { // Проверяем наличие анимаций
                // console.log('Starting animation')
                hasPlayedAnimation = true
                fadeOnPlanets()
                // Проверяем mixer перед воспроизведением
                if (sceneOneAnimationMixer) {
                    sceneOneAnimations.forEach((clip) => {
                        const action = sceneOneAnimationMixer.clipAction(clip)
                        // console.log('Playing animation clip:', clip.name)
                        action.setLoop(THREE.LoopOnce, 1)
                        action.clampWhenFinished = true
                        action.play()
                    })
                }

                if (sceneTwoAnimationMixer) {
                    sceneTwoAnimations.forEach(clip => {
                        const action = sceneTwoAnimationMixer.clipAction(clip)
                        action.play()
                    })
                }

                if (kVisualBGAnimationMixer) {
                    kVisualBGAnimations.forEach(clip => {
                        const action = kVisualBGAnimationMixer.clipAction(clip)
                        action.setLoop(THREE.LoopOnce, 1)
                        action.clampWhenFinished = true
                        action.play()
                    })
                }
            }
        }
    }

    const hideTarget = ({ detail }) => {
        if (detail.name === 'qr-target') {
            showContainerGroup.visible = false
            hasPlayedAnimation = false
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
            scene.add(
                ambientLight, pointLight, directionalLight)



            const thatSparklesGroup = sparklesSystem.getGroup()
            thatSparklesGroup.position.y = 0.75
            sceneGroup.add(thatSparklesGroup)
            sceneGroup.position.y = 1
            sceneGroup.scale.set(1.5, 1.5, 1.5)
            showContainerGroup.add(sceneGroup)
            scene.add(showContainerGroup)
            sparklesSystem.init()


            const captureController = new CaptureController()
            captureController.initButtonHandlers()


            // canvas.addEventListener('touchmove', (event) => {
            //     event.preventDefault()
            // })

            XR8.XrController.updateCameraProjectionMatrix({
                origin: camera.position,
                facing: camera.quaternion,
            })
        },
        onUpdate: () => {
            const currentTime = clock.getElapsedTime()
            const deltaTime = currentTime - lastTime
            sparklesSystem.update(currentTime)

            // if (flag && flag.material && flag.material.uniforms) {
            //     flag.material.uniforms.time.value = currentTime
            // }

            // Обновляем uniform time для всех мешей
            // if (kVisualBG) {
            //     kVisualBG.traverse((child) => {
            //         if (child.isMesh && child.material.uniforms) {
            //             child.material.uniforms.time.value = currentTime
            //         }
            //     })
            // }

            if (sceneOneAnimationMixer && sceneTwoAnimationMixer && kVisualBGAnimationMixer ) {
                mixers.forEach((mixer) => {
                    if (mixer) {
                        mixer.update(deltaTime)
                    }
                })
            }
            lastTime = currentTime
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



const load = () => {
    initLoader()
}
window.onload = () => {
    if (window.XRExtras) {
        load()
    } else {
        window.addEventListener('xrextrasloaded', load)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadImage = document.getElementById("loadImage")
    if (loadImage) {
        loadImage.src = "/assets/load-grad.png"
    }
    const instructionsScreen = document.getElementById('instructions-screen')
    const startButton = document.getElementById('start-button')

    startButton.addEventListener('click', () => {
        // Скрываем экран инструкций
        instructionsScreen.style.display = 'none'

        // Показываем экран загрузки 8th Wall после скрытия инструкций
        XRExtras.Loading.showLoading({ onxrloaded })
    })
})