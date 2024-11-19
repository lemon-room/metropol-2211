import {
  TextureLoader, ShaderMaterial, AdditiveBlending
} from 'three'

export const particleMaterial = new ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0 },
      pointTexture: {
        value: new TextureLoader().load('/assets/dotTexture.png')
      },
      time: { value: 0 }
    },
    vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;


                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                    float flutter = sin(time * 2.0 + position.x * 10.0) * 0.3 +
                                sin(time * 1.5 + position.y * 8.0) * 0.3 +
                                sin(time * 1.0 + position.z * 6.0) * 0.4;

                    float dist = -mvPosition.z;
                    float sizeScale = clamp(300.0 / dist, 5.0, 15.0);

                    gl_PointSize = size * sizeScale * (0.7 + 0.3 * flutter);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
    fragmentShader: `
                uniform float uOpacity;
                uniform sampler2D pointTexture;
                varying vec3 vColor;

                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor, texColor.a * uOpacity);
                }
            `,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    transparent: true,
  })

//
// export function createBlackHoleMaterial() {
//   return new ShaderMaterial({
//     uniforms: {
//       time: { value: 0 },
//       radius: { value: 0.8 },
//       softness: { value: 0.3 },
//       color: { value: new Color(0xbd7543) },
//       opacity: { value: 0.85 }
//     },
//     vertexShader:
//       `
//     varying vec2 vUv;
//     void main() {
//         vUv = uv;
//         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//     `
//     ,
//     fragmentShader:
//       `
//     uniform float time;
//     uniform float radius;
//     uniform float softness;
//     uniform vec3 color;
//     uniform float opacity;
//
//     varying vec2 vUv;
//
//     void main() {
//     // Преобразуем UV координаты в диапазон от -1 до 1
//     vec2 uv = vUv * 2.0 - 1.0;
//
//     // Вычисляем расстояние от центра
//     float dist = length(uv);
//
//     // Создаем базовый градиент
//     float gradient = 1.0 - smoothstep(radius - softness, radius + softness, dist);
//
//     // Добавляем пульсацию
//     float pulse = sin(time * 2.0) * 0.05;
//     gradient *= 1.0 + pulse;
//
//     // Добавляем вихревой эффект
//     float angle = atan(uv.y, uv.x);
//     float spiral = sin(angle * 5.0 + time * 3.0) * 0.05;
//     gradient *= 1.0 + spiral;
//
//     // Применяем цвет и прозрачность
//     gl_FragColor = vec4(color, opacity * gradient);
//     }
//     `
//     ,
//     transparent: true,
//     side: DoubleSide,
//     depthTest: false,      // Отключаем тест глубины
//     depthWrite: false,     // Отключаем запись в буфер глубины
//     blending: AdditiveBlending
//   })
// }