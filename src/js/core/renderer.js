import {
  ACESFilmicToneMapping,
  Color,
  PCFShadowMap,
  Scene,
  WebGLRenderer,
} from 'three'

export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

// Scene
export const scene = new Scene()
scene.background = new Color('#333')

const canvasParant = document.getElementById('three-canvas')

// Renderer
export const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
})

canvasParant.appendChild(renderer.domElement)
export const canvas = canvasParant.children[0]
// More realistic shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFShadowMap

renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1


function updateRenderer() {
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  // To avoid performance problems on devices with higher pixel ratio
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  updateRenderer()
})

updateRenderer()

export default {
  renderer
}
