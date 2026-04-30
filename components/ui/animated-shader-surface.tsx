"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedShaderSurfaceProps {
  className?: string
  accentColor?: string
  secondaryColor?: string
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
uniform vec3 accent;
uniform vec3 secondary;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = m * p;
    amplitude *= 0.52;
  }

  return value;
}

float beam(vec2 uv, float offset, float speed, float width) {
  float wave = uv.y + offset + sin(uv.x * 5.0 + time * speed) * 0.12;
  float distanceToBeam = abs(wave);
  return smoothstep(width, 0.0, distanceToBeam);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);
  vec2 drift = uv * vec2(1.35, 1.0);
  float t = time * 0.18;

  float fieldA = fbm(drift * 2.3 + vec2(t * 1.2, -t * 0.8));
  float fieldB = fbm((drift + vec2(2.4, -1.3)) * 3.2 - vec2(t * 0.7, -t * 1.1));

  vec2 pointerDrift = uv - pointer * vec2(0.42, 0.3);
  float pointerGlow = exp(-4.8 * dot(pointerDrift, pointerDrift));

  float beamA = beam(uv * vec2(1.0, 1.25), 0.08, 1.4, 0.045);
  float beamB = beam((uv + vec2(0.0, 0.18)) * vec2(1.15, 1.35), -0.24, 1.0, 0.06);
  float highlight = pow(max(beamA, beamB), 24.0);

  vec3 base = vec3(0.02, 0.035, 0.06);
  vec3 palette = mix(accent, secondary, clamp(fieldB * 0.88 + 0.08, 0.0, 1.0));
  vec3 color = base;

  color += palette * (0.18 + fieldA * 0.38);
  color += accent * beamA * 0.42;
  color += secondary * beamB * 0.28;
  color += (accent * 0.28 + secondary * 0.16) * pointerGlow;
  color += vec3(1.0) * highlight * 0.65;

  float vignette = smoothstep(1.45, 0.18, length(uv * vec2(0.92, 1.08)));
  color *= vignette;
  color = pow(color, vec3(0.92));

  fragColor = vec4(color, 0.9);
}`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseColor(color: string | undefined, fallback: [number, number, number]) {
  if (!color) return fallback

  const normalized = color.trim().replace("#", "")
  const source =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => value + value)
          .join("")
      : normalized.length >= 6
        ? normalized.slice(0, 6)
        : ""

  if (source.length !== 6) return fallback

  const red = parseInt(source.slice(0, 2), 16)
  const green = parseInt(source.slice(2, 4), 16)
  const blue = parseInt(source.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) return fallback

  return [red / 255, green / 255, blue / 255] as [number, number, number]
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  return { program, vertexShader, fragmentShader }
}

export default function AnimatedShaderSurface({
  className,
  accentColor = "#E8392A",
  secondaryColor = "#38bdf8",
}: AnimatedShaderSurfaceProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches) return

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    })

    if (!gl) return

    const resources = createProgram(gl)
    if (!resources) return

    const { program, vertexShader, fragmentShader } = resources
    const buffer = gl.createBuffer()
    if (!buffer) {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    const positionLocation = gl.getAttribLocation(program, "position")
    const resolutionLocation = gl.getUniformLocation(program, "resolution")
    const timeLocation = gl.getUniformLocation(program, "time")
    const pointerLocation = gl.getUniformLocation(program, "pointer")
    const accentLocation = gl.getUniformLocation(program, "accent")
    const secondaryLocation = gl.getUniformLocation(program, "secondary")

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ])

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const accent = parseColor(accentColor, [0.91, 0.22, 0.16])
    const secondary = parseColor(secondaryColor, [0.22, 0.74, 0.97])
    const pointer = { x: 0, y: 0, active: false }

    let frame = 0

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(wrap)
    resize()

    const handlePointerMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const relativeX = (event.clientX - rect.left) / rect.width
      const relativeY = (event.clientY - rect.top) / rect.height

      pointer.active = relativeX >= 0 && relativeX <= 1 && relativeY >= 0 && relativeY <= 1
      if (!pointer.active) return

      pointer.x = clamp(relativeX * 2 - 1, -1, 1)
      pointer.y = clamp(1 - relativeY * 2, -1, 1)
    }

    const handlePointerLeave = () => {
      pointer.active = false
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerleave", handlePointerLeave)

    const render = (now: number) => {
      const time = now * 0.001
      const fallbackX = Math.sin(time * 0.45) * 0.18
      const fallbackY = Math.cos(time * 0.32) * 0.12
      const pointerX = pointer.active ? pointer.x * 0.45 : fallbackX
      const pointerY = pointer.active ? pointer.y * 0.35 : fallbackY

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(timeLocation, time)
      gl.uniform2f(pointerLocation, pointerX, pointerY)
      gl.uniform3fv(accentLocation, accent)
      gl.uniform3fv(secondaryLocation, secondary)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      frame = window.requestAnimationFrame(render)
    }

    frame = window.requestAnimationFrame(render)

    return () => {
      observer.disconnect()
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
      window.cancelAnimationFrame(frame)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [accentColor, secondaryColor])

  return (
    <div ref={wrapRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,8,14,0.18),rgba(5,8,14,0.48)_52%,rgba(5,8,14,0.7))]" />
    </div>
  )
}
