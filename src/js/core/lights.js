import {
  AmbientLight, PointLight, DirectionalLight
} from 'three'
// Lights
export const ambientLight = new AmbientLight(0xffffff, 0.8)

export const pointLight = new PointLight(0xffffff, 10)
pointLight.lookAt(0, 1.5, 0)
pointLight.position.set(0, 3, 6)

export const directionalLight = new DirectionalLight('#ffffff', 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 4, 2.25)