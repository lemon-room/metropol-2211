import * as THREE from 'three'

import { renderer, scene } from './core/renderer.js'
import camera from './core/camera.js'
import { loaderGLB } from './core/loaders.js'
import { particleMaterial } from './core/materials.js'
import { ParticleSystem } from './core/particleSystem.js'
import { ambientLight, pointLight, directionalLight } from './core/lights.js'
import { CaptureController } from './utils/screenCapture.js'

// Constants
const particleSystemInstance = new ParticleSystem()
const FRAME_RATE = 1000 / 60
const clock = new THREE.Clock()
const mixers = []

let sceneOne, sceneTwo, circleParticle

// Initialization
function init() {

    scene.add(ambientLight, pointLight, directionalLight)

    const captureController = new CaptureController()
    captureController.initButtonHandlers()
    loaderGLB.load('/assets/models/BG.glb', (gltf) => {

        const mainMesh = gltf.scene
        scene.add(mainMesh)
        mainMesh.visible = false
        mainMesh.position.y = 2
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
            scene.add(particleSystem)
        }
    })
    loaderGLB.load('/assets/models/KV.glb', (gltf) => {

        sceneOne = gltf.scene
        scene.add(sceneOne)
        // sceneOne.traverse(function (child) {

        //     if (child.name === 'Circle-Particle') {
        //         circleParticle = child
        //     }

        // })


        sceneOne.position.y = 1
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
    // loaderGLB.load('/assets/models/Planets.glb', (gltf) => {

    //     sceneTwo = gltf.scene
    //     scene.add(sceneTwo)

    //     sceneTwo.position.y = 2.5
    //     sceneTwo.scale.set(0.45, 0.45, 0.45)

    //     if (gltf.animations && gltf.animations.length > 0) {
    //         console.log('Found animations:', gltf.animations)
    //         const mixer = new THREE.AnimationMixer(sceneTwo)

    //         gltf.animations.forEach((clip) => {
    //             console.log('Playing animation:', clip.name)
    //             const action = mixer.clipAction(clip)
    //             action.play()
    //         })

    //         // Добавляем mixer в массив или объект для обновления
    //         // Например, можно создать массив mixers в начале файла
    //         mixers.push(mixer)
    //     }

    // })

    animate()
}

// Animation loop
let lastTime = performance.now()
function animate() {
    requestAnimationFrame(animate)

    const currentTime = performance.now()
    const deltaTime = currentTime - lastTime

    if (deltaTime > FRAME_RATE) {
        const delta = clock.getDelta()
        mixers.forEach(mixer => mixer.update(delta))
        particleSystemInstance.update(delta)
        particleMaterial.uniforms.time.value = clock.getElapsedTime()

        renderer.render(scene, camera)
        lastTime = currentTime
    }
}
init()