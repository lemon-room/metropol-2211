import * as THREE from 'three'
import { MeshSurfaceSampler } from '/src/js/three/addons/math/MeshSurfaceSampler.js'
import { particleMaterial } from './materials.js'

const PARTICLE_COUNT = 10000

export class ParticleSystem {
  constructor() {
    this.mixer = null
    this.particleSystem = null
    this.tempPosition = new THREE.Vector3()
  }

  createFromMesh(gltfScene) {
    const targetMesh = gltfScene.getObjectByName('KV_BG')
    if (!targetMesh) {
      console.error('Mesh KV_BG not found')
      return null
    }

    const sampler = new MeshSurfaceSampler(targetMesh).build()
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3)
    const nextPositions = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      sampler.sample(this.tempPosition)
      const i3 = i * 3

      positions[i3] = this.tempPosition.x
      positions[i3 + 1] = this.tempPosition.y
      positions[i3 + 2] = this.tempPosition.z

      originalPositions[i3] = this.tempPosition.x
      originalPositions[i3 + 1] = this.tempPosition.y
      originalPositions[i3 + 2] = this.tempPosition.z

      nextPositions[i3] = this.tempPosition.x
      nextPositions[i3 + 1] = this.tempPosition.y
      nextPositions[i3 + 2] = this.tempPosition.z
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3))
    geometry.setAttribute('nextPosition', new THREE.BufferAttribute(nextPositions, 3))

    this.particleSystem = new THREE.Points(geometry, particleMaterial)
    this.setupAnimation(targetMesh, gltfScene, sampler)

    return this.particleSystem
  }

  setupAnimation(targetMesh, gltfScene, sampler) {
    if (gltfScene.animations && gltfScene.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(targetMesh)

      gltfScene.animations.forEach((clip) => {
        const action = this.mixer.clipAction(clip)
        action.play()
      })

      this.mixer.addEventListener('loop', () => {
        const nextPositions = this.particleSystem.geometry.attributes.nextPosition

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          sampler.sample(this.tempPosition)
          const i3 = i * 3

          nextPositions.array[i3] = this.tempPosition.x
          nextPositions.array[i3 + 1] = this.tempPosition.y
          nextPositions.array[i3 + 2] = this.tempPosition.z
        }

        nextPositions.needsUpdate = true
      })
    }
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta)
    }
  }
}