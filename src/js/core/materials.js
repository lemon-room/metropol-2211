import {
  ShaderMaterial, Color, AdditiveBlending, DoubleSide
} from 'three'

const PARTICLE_SIZE = 24
const baseColor = new Color(0xffd700)
const glowColor = new Color(0xff8c00)
export const particleMaterial = new ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    size: { value: PARTICLE_SIZE },
    baseColor: { value: baseColor },
    glowColor: { value: glowColor },
    wingSpread: { value: 0.3 },
    flapSpeed: { value: 1.0 },
  },
  vertexShader: `
    uniform float time;
    uniform float size;
    uniform float wingSpread;
    uniform float flapSpeed;
    
    attribute vec3 originalPosition;
    attribute vec3 nextPosition;
    
    varying float vIntensity;
    varying vec3 vPosition;
    varying float vGlitter;
    
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
        vec3 pos = originalPosition;
        vPosition = pos;
        
        float side = sign(pos.x);
        float wingPhase = time * flapSpeed;
        float flapAmount = sin(wingPhase) * wingSpread;
        
        // Базовая анимация взмахов
        pos.y += flapAmount * abs(pos.x) * 0.25;
        pos.z += cos(wingPhase) * abs(pos.x) * 0.15 * side;

        // Замедленные базовые эффекты мерцания с уменьшенной интенсивностью
        float sparkleTime = time * 2.0;
        float sparklePhase = sin(sparkleTime * 0.5);
        float distFromCenter = length(pos.xz);
        float wavePhase = sin(sparkleTime - distFromCenter * 2.0);
        
        float sparkle = sin(pos.x * 4.0 + sparkleTime) * 
                       sin(pos.z * 4.0 + sparkleTime) * 
                       sin(distFromCenter * 3.0 - sparkleTime);
        
        // Эффект блесток
        float particleId = random(pos.xz);
        float glitterTime = time * 0.8;
        float glitterPhase = mod(glitterTime + particleId * 8.0, 6.28318);
        
        float glitter = pow(max(sin(glitterPhase), 0.0), 8.0);
        float isGlitter = step(0.85, random(pos.xz + floor(time * 0.2)));
        vGlitter = glitter * isGlitter;
        
        // Уменьшаем общую интенсивность вдвое
        vIntensity = 1.0 + 
                    (wavePhase * 0.3 +
                    sparkle * 0.2 +
                    sparklePhase * 0.2) * 0.5; // Уменьшили интенсивность общего мерцания на 50%
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        float sizeVar = 1.0 + sparkle * 0.15 + vGlitter * 0.3;
        gl_PointSize = size * sizeVar * (1.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform vec3 baseColor;
    uniform vec3 glowColor;
    uniform float time;
    
    varying float vIntensity;
    varying vec3 vPosition;
    varying float vGlitter;
    
    void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center * 2.0);
        
        if (dist > 1.0) discard;

        float shimmer = sin(time * 2.0 + vPosition.x * 5.0 + vPosition.z * 5.0) * 0.5 + 0.5;
        float glow = 1.0 - smoothstep(0.0, 1.0, dist);
        
        vec3 glitterColor = mix(glowColor, vec3(1.0), 0.1);
        
        vec3 sparkColor = mix(baseColor, glowColor, shimmer * 0.5); // Уменьшили интенсивность смешивания
        vec3 finalColor = mix(
            sparkColor,
            glitterColor,
            glow * vIntensity
        );
        
        // Добавляем блестки с оригинальной интенсивностью
        finalColor += glitterColor * pow(glow, 2.0) * vGlitter * 2.0;
        
        // Общее свечение уменьшено, блестки остаются яркими
        finalColor *= 1.0 + vGlitter * 1.5;
        
        float alpha = glow * (0.8 + vIntensity * 0.2);
        
        gl_FragColor = vec4(finalColor, alpha);
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