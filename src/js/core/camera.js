import { PerspectiveCamera } from 'three'
import { scene, sizes } from './renderer.js'

const VERTICAL_FIELD_OF_VIEW = 45 // degrees 45 is the normal

export const camera = new PerspectiveCamera(
  VERTICAL_FIELD_OF_VIEW,
  sizes.width / sizes.height,
)

camera.position.set(0, 3, 6)

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
})

scene.add(camera)

export default camera
