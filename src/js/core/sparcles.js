import * as THREE from 'three'
import { particleMaterial } from './materials.js'
export class SparklesSystem {
    constructor() {
        this.sparkles = []
        this.geometry = new THREE.BufferGeometry()
        this.material = particleMaterial
        this.particlesGroup = new THREE.Group()
        this.particleCount = 300
        this.initialized = false
    }


    init() {
        if (this.initialized) return

        const positions = new Float32Array(this.particleCount * 3)
        const colors = new Float32Array(this.particleCount * 3)
        const sizes = new Float32Array(this.particleCount)

        for (let i = 0; i < this.particleCount; i++) {
            const spark = new Sparkle()
            spark.setup()
            this.sparkles.push(spark)

            const color = new THREE.Color(0xFFF0AC).multiplyScalar(0.7)
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b

            sizes[i] = spark.size
            positions[i * 3] = spark.x
            positions[i * 3 + 1] = spark.y
            positions[i * 3 + 2] = spark.z
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const points = new THREE.Points(this.geometry, this.material)
        points.frustumCulled = false
        points.renderOrder = 999

        this.particlesGroup.add(points)
        this.initialized = true
    }

    update(time) {
        if (!this.initialized) return

        const positions = this.geometry.attributes.position.array

        for (let i = 0; i < this.sparkles.length; i++) {
            const spark = this.sparkles[i]
            spark.update(time)

            positions[i * 3] = spark.x
            positions[i * 3 + 1] = spark.y
            positions[i * 3 + 2] = spark.z
        }

        this.geometry.attributes.position.needsUpdate = true
        this.material.uniforms.time.value = time
    }

    getGroup() {
        return this.particlesGroup
    }
}

class Sparkle extends THREE.Vector3 {
    constructor() {
        super()
        this.size = Math.random() * 0.5 + 0.4
        this.originalY = 0
        this.speed = Math.random() * 0.02 + 0.01
        this.angle = Math.random() * Math.PI * 2
        this.orbitSpeed = (Math.random() * 0.2 + 0.1) * (Math.random() < 0.5 ? 1 : -1)
        this.orbitRadius = Math.random() * 0.5 + 1
        this.phaseOffset = Math.random() * Math.PI * 2
    }

    setup() {
        const radius = 1.2
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI * 2

        this.x = radius * Math.sin(theta) * Math.cos(phi)
        this.y = radius * Math.sin(theta) * Math.sin(phi)
        this.z = radius * Math.cos(theta)

        this.originalY = this.y
    }

    update(time) {
        this.angle += this.orbitSpeed * 0.01

        const orbitX = Math.cos(this.angle) * this.orbitRadius
        const orbitZ = Math.sin(this.angle) * this.orbitRadius

        this.x = orbitX
        this.y = this.originalY + Math.sin(time * this.speed + this.phaseOffset) * 0.2
        this.z = orbitZ
    }
}