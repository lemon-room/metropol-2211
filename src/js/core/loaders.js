import {
  LoadingManager,
} from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
window.GLTFLoader = GLTFLoader
const manager = new LoadingManager()

manager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log("Начало загрузки")
}
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
  console.log(
    "Загружаем: " +
    url +
    ".\nЗагружено " +
    itemsLoaded +
    " из " +
    itemsTotal +
    " файлов.",
  )
}
manager.onLoad = function () { console.log("Загрузка завершена!") }
manager.onError = function (url) { console.log("Ошибка загркзки " + url) }


// Loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/src/js/three/addons/libs/draco/')
dracoLoader.setDecoderConfig({ type: 'wasm' })
export const loaderGLB = new GLTFLoader(manager)
export const loaderRGBE = new RGBELoader(manager)
loaderGLB.setDRACOLoader(dracoLoader)
