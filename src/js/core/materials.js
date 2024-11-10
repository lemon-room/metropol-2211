import {
  ShaderMaterial, Color, Vector2, AdditiveBlending, DoubleSide
} from 'three'

const PARTICLE_SIZE = 2
const baseColor = new Color(0xffd700)
const glowColor = new Color(0xff8c00)

export const particleMaterial = new ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    size: { value: PARTICLE_SIZE },
    baseColor: { value: baseColor },
    glowColor: { value: glowColor },
  },
  vertexShader: `
        uniform float time;
        uniform float size;
        
        attribute vec3 originalPosition;
        attribute vec3 nextPosition;
        
        varying float vIntensity;
        
        void main() {
            // Интерполируем между оригинальной и следующей позициями
            vec3 pos = mix(originalPosition, nextPosition, fract(time));
            
            // Добавляем небольшое колебание для живости
            float wave = sin(time * 2.0 + pos.x * 3.0) * 0.002;
            pos.y += wave;
            
            vIntensity = 0.6 + abs(wave) * 200.0;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Размер частицы зависит от расстояния до камеры
            gl_PointSize = size * (1.0 / -mvPosition.z);
        }
    `,
  fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 glowColor;
        
        varying float vIntensity;
        
        void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center * 2.0);
            
            if (dist > 1.0) discard;
            
            float glow = 1.0 - smoothstep(0.0, 1.0, dist);
            vec3 finalColor = mix(glowColor, baseColor, glow * vIntensity) + 
                             glowColor * (1.0 - dist) * 0.3;
            
            gl_FragColor = vec4(finalColor, glow * vIntensity);
        }
    `,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
})

export const outlineMaterial = new ShaderMaterial({
  uniforms: {
    uOpacity: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader:
    `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  fragmentShader:
    `
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    // Вычисляем угол между нормалью и направлением взгляда
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - abs(dot(viewDir, vNormal));
    
    // Делаем контур очень тонким
    rim = smoothstep(0.6, 0.8, rim);
    
    // Базовый цвет золота
    vec3 goldColor = vec3(1.0, 0.84, 0.0);
    
    // Добавляем пульсацию
    float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
    
    // Если не край - отбрасываем фрагмент
    if (rim < 0.1) discard;
    
    // Итоговый цвет с пульсацией
    vec3 finalColor = goldColor * pulse * 1.5;
    float alpha = rim;
    
    gl_FragColor = vec4(finalColor, alpha * uOpacity);
  }
   `
  ,
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
    vertexShader:
      `
    varying vec3 vNormal;
    varying vec3 vPositionW;

    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 positionW = modelMatrix * vec4(position, 1.0);
        vPositionW = positionW.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `
    ,
    fragmentShader:
      `
    uniform vec3 glowColor;
    uniform float intensity;

    varying vec3 vNormal;
    varying vec3 vPositionW;

    void main() {
        // Используем встроенную переменную cameraPosition
        vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
        float fresnel = dot(viewDirectionW, vNormal);
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        fresnel = pow(fresnel, 3.0) * intensity;
        
        gl_FragColor = vec4(glowColor, 1.0) * fresnel;
    }
    `
    ,
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
    vertexShader:
      `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `
    ,
    fragmentShader:
      `
    uniform float time;
    uniform float radius;
    uniform float softness;
    uniform vec3 color;
    uniform float opacity;

    varying vec2 vUv;

    void main() {
    // Преобразуем UV координаты в диапазон от -1 до 1
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Вычисляем расстояние от центра
    float dist = length(uv);
    
    // Создаем базовый градиент
    float gradient = 1.0 - smoothstep(radius - softness, radius + softness, dist);
    
    // Добавляем пульсацию
    float pulse = sin(time * 2.0) * 0.05;
    gradient *= 1.0 + pulse;
    
    // Добавляем вихревой эффект
    float angle = atan(uv.y, uv.x);
    float spiral = sin(angle * 5.0 + time * 3.0) * 0.05;
    gradient *= 1.0 + spiral;
    
    // Применяем цвет и прозрачность
    gl_FragColor = vec4(color, opacity * gradient);
    }
    `
    ,
    transparent: true,
    side: DoubleSide,
    depthTest: false,      // Отключаем тест глубины
    depthWrite: false,     // Отключаем запись в буфер глубины
    blending: AdditiveBlending
  })
}