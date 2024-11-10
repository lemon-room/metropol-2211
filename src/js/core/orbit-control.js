import { OrbitControls } from '/src/js/three/addons/controls/OrbitControls.js'
import { camera } from './camera.js'
import { renderer } from './renderer.js'

export const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
