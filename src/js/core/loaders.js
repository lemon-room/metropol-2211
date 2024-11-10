import {
  LoadingManager,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

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
dracoLoader.setDecoderPath('/draco/')
dracoLoader.setDecoderConfig({ type: 'wasm' })
export const loaderGLB = new GLTFLoader(manager)
export const loaderRGBE = new RGBELoader(manager)
loaderGLB.setDRACOLoader(dracoLoader)
