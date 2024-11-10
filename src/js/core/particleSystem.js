import {
  Euler, Vector2, Vector3, BufferGeometry, Float32BufferAttribute, Points
} from 'three'
import { particleMaterial } from './materials'
export function createParticleSystem(
  geometry,
  position = new Vector3(),
  rotation = new Euler(),
  scale = new Vector3(1, 1, 1),
) {
  const positions = []
  const uvs = []
  const positionAttribute = geometry.attributes.position
  const uvAttribute = geometry.attributes.uv

  for (let i = 0; i < positionAttribute.count; i += 3) {
    const v1 = new Vector3(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i),
    )
    const v2 = new Vector3(
      positionAttribute.getX(i + 1),
      positionAttribute.getY(i + 1),
      positionAttribute.getZ(i + 1),
    )
    const v3 = new Vector3(
      positionAttribute.getX(i + 2),
      positionAttribute.getY(i + 2),
      positionAttribute.getZ(i + 2),
    )

    const numParticlesPerTriangle = 2
    for (let j = 0; j < numParticlesPerTriangle; j++) {
      const r1 = Math.random()
      const r2 = Math.random()
      const sqrtR1 = Math.sqrt(r1)

      const u = 1.0 - sqrtR1
      const v = r2 * sqrtR1
      const w = 1.0 - u - v

      const position = new Vector3()
        .addScaledVector(v1, u)
        .addScaledVector(v2, v)
        .addScaledVector(v3, w)

      position.x += (Math.random() - 0.5) * 0.02
      position.y += (Math.random() - 0.5) * 0.02
      position.z += (Math.random() - 0.5) * 0.02

      positions.push(position.x, position.y, position.z)

      if (uvAttribute) {
        const uv1 = new Vector2(uvAttribute.getX(i), uvAttribute.getY(i))
        const uv2 = new Vector2(
          uvAttribute.getX(i + 1),
          uvAttribute.getY(i + 1),
        )
        const uv3 = new Vector2(
          uvAttribute.getX(i + 2),
          uvAttribute.getY(i + 2),
        )

        const uv = new Vector2()
          .addScaledVector(uv1, u)
          .addScaledVector(uv2, v)
          .addScaledVector(uv3, w)

        uvs.push(uv.x, uv.y)
      }
    }
  }

  const particleGeometry = new BufferGeometry()
  particleGeometry.setAttribute(
    'position',
    new Float32BufferAttribute(positions, 3),
  )
  if (uvs.length > 0) {
    particleGeometry.setAttribute(
      'uv',
      new Float32BufferAttribute(uvs, 2),
    )
  }

  const particles = new Points(particleGeometry, particleMaterial)
  particles.position.copy(position)
  particles.rotation.copy(rotation)
  particles.scale.copy(scale)

  return particles
}
