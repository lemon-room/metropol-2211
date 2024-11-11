import * as THREE from 'three'
import { MeshSurfaceSampler } from '/src/js/three/addons/math/MeshSurfaceSampler.js'
import { particleMaterial } from './materials.js'

const PARTICLE_COUNT = 10000
export class ParticleSystem {
  constructor() {
    this.mixer = null
    this.particles = null
    this.sampler = null
    this.targetMesh = null
    this.tempPosition = new THREE.Vector3()
    this.clock = new THREE.Clock() // Добавляем свой clock для отслеживания времени
  }

  createFromMesh(gltfScene) {
    this.targetMesh = gltfScene.getObjectByName('KV_BG')
    if (!this.targetMesh) {

      return null
    }


    // Создаем сэмплер
    this.sampler = new MeshSurfaceSampler(this.targetMesh).build()

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3)
    const nextPositions = new Float32Array(PARTICLE_COUNT * 3)

    // Начальное сэмплирование
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.sampler.sample(this.tempPosition)
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

    this.particles = new THREE.Points(geometry, particleMaterial)

    // Настраиваем анимацию
    if (gltfScene.animations && gltfScene.animations.length > 0) {

      this.mixer = new THREE.AnimationMixer(this.targetMesh)

      gltfScene.animations.forEach((clip, index) => {

        const action = this.mixer.clipAction(clip)
        action.play()
      })

      // Добавляем слушатель обновления анимации
      this.mixer.addEventListener('loop', (e) => {

      })
    }

    return this.particles
  }

  updateParticlePositions() {
    if (!this.targetMesh || !this.particles) return;

    // Пересоздаем sampler с текущей геометрией
    this.sampler = new MeshSurfaceSampler(this.targetMesh).build()

    const positions = this.particles.geometry.attributes.position
    const nextPositions = this.particles.geometry.attributes.nextPosition
    const originalPositions = this.particles.geometry.attributes.originalPosition

    // Копируем текущие позиции в originalPositions
    for (let i = 0; i < positions.array.length; i++) {
      originalPositions.array[i] = positions.array[i]
    }

    // Сэмплируем новые позиции
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.sampler.sample(this.tempPosition)
      const i3 = i * 3

      nextPositions.array[i3] = this.tempPosition.x
      nextPositions.array[i3 + 1] = this.tempPosition.y
      nextPositions.array[i3 + 2] = this.tempPosition.z
    }

    // Помечаем буферы как требующие обновления
    positions.needsUpdate = true
    originalPositions.needsUpdate = true
    nextPositions.needsUpdate = true

  }

  update(delta) {
    if (this.mixer) {
      // Обновляем анимацию
      this.mixer.update(delta)

      // Обновляем позиции частиц каждый кадр
      this.updateParticlePositions()

      // Обновляем время в шейдере
      if (particleMaterial.uniforms && particleMaterial.uniforms.time) {
        particleMaterial.uniforms.time.value = this.clock.getElapsedTime()
      }
    }
  }
}