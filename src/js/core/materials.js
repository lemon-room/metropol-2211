import {
  ShaderMaterial, Color, Vector2, AdditiveBlending, DoubleSide
} from 'three'
import vsParticles from '../shaders/particles/vertex.glsl'
import fsParticles from '../shaders/particles/fragment.glsl'
import vsOutlines from '../shaders/outlines/vertex.glsl'
import fsOutlines from '../shaders/outlines/fragment.glsl'
import vsPlanets from '../shaders/planets/vertex.glsl'
import fsPlanets from '../shaders/planets/fragment.glsl'
import vsBlackHole from '../shaders/hole/vertex.glsl'
import fsBlackHole from '../shaders/hole/fragment.glsl'
export const particleMaterial = new ShaderMaterial({
  uniforms: {
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uFrequency: { value: new Vector2(2.0, 1.5) },
  },
  vertexShader: vsParticles,
  fragmentShader: fsParticles,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  side: DoubleSide
})

export const outlineMaterial = new ShaderMaterial({
  uniforms: {
    uOpacity: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: vsOutlines,
  fragmentShader: fsOutlines,
  transparent: true,
  side: DoubleSide,
  depthWrite: false,
  blending: AdditiveBlending,
})

// Функция для создания светящегося материала
export function createGlowMaterial(color = new Color(0xbd7543), intensity = 0.5) {
  return new ShaderMaterial({
    uniforms: {
      glowColor: { value: color },
      intensity: { value: intensity }
    },
    vertexShader: vsPlanets,
    fragmentShader: fsPlanets,
    transparent: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    depthWrite: false
  })
}
export function createBlackHoleMaterial() {
  return new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      radius: { value: 0.8 },
      softness: { value: 0.3 },
      color: { value: new Color(0xbd7543) },
      opacity: { value: 0.85 }
    },
    vertexShader: vsBlackHole,
    fragmentShader: fsBlackHole,
    transparent: true,
    side: DoubleSide,
    depthTest: false,      // Отключаем тест глубины
    depthWrite: false,     // Отключаем запись в буфер глубины
    blending: AdditiveBlending
  })
}