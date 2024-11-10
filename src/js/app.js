import * as THREE from 'three'

import { renderer, scene } from './core/renderer.js'
import camera from './core/camera.js'
import { loaderGLB } from './core/loaders.js'
import { particleMaterial } from './core/materials.js'
import { ParticleSystem } from './core/particleSystem.js'
import { ambientLight, pointLight, directionalLight } from './core/lights.js'

// Constants
const particleSystemInstance = new ParticleSystem()
const FRAME_RATE = 1000 / 60
const clock = new THREE.Clock()

// Scene setup
function initScene() {
    scene.add(ambientLight, pointLight, directionalLight)

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10, 10, 10),
        new THREE.MeshToonMaterial({ color: '#444' })
    )
    plane.position.set(0, 0, 0)
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    scene.add(plane)
}

// Animation loop
let lastTime = performance.now()
function animate() {
    requestAnimationFrame(animate)

    const currentTime = performance.now()
    const deltaTime = currentTime - lastTime

    if (deltaTime > FRAME_RATE) {
        const delta = clock.getDelta()

        particleSystemInstance.update(delta)
        particleMaterial.uniforms.time.value = clock.getElapsedTime()

        renderer.render(scene, camera)
        lastTime = currentTime
    }
}

// Initialization
function init() {
    initScene()

    loaderGLB.load('/assets/models/BG_1110.glb', (gltf) => {
        const particleSystem = particleSystemInstance.createFromMesh(gltf.scene)
        if (particleSystem) {
            scene.add(particleSystem)
        }
    })

    animate()
}

init()