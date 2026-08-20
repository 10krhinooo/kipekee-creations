import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { PerspectiveCamera, RoundedBox, View } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, PlaneGeometry } from 'three'
import { Stage } from '../../three/Stage'
import { finishForPattern, type MaterialSource } from '../../three/lib/materialSource'
import { useFabricMaterial } from '../../three/materials/useFabricMaterial'
import { useOrbitDrag, type OrbitState } from '../../three/lib/orbit'
import { reducedMotion } from '../../lib/motion'
import type { PatternKind } from '../../data/types'
import type { PreviewProps, SceneKind } from './types'

const HOME = { radius: 5.4, height: 1.8 }
const TARGETS: Record<SceneKind, [number, number, number]> = {
  window: [0, 1.3, -1.9],
  bed: [0, 0.95, -0.25],
  sofa: [0, 1.05, -0.2],
  bath: [0, 1.05, -0.3],
  dining: [0, 0.85, -0.35],
}

const RADII: Record<SceneKind, number> = {
  window: 5.4,
  bed: 7.25,
  sofa: 9.5,
  bath: 5.65,
  dining: 8.25,
}

function RequestFrame() {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => invalidate())
  return null
}

function CameraRig({ orbit, scene, variant, sizeVariant }: { orbit: RefObject<OrbitState>; scene: SceneKind; variant?: PreviewProps['variant']; sizeVariant?: string }) {
  const invalidate = useThree((state) => state.invalidate)
  const target: [number, number, number] = scene === 'window' && variant === 'rail'
    ? [0, 1.8, 0]
    : scene === 'bed' && sizeVariant?.includes('four-poster')
      ? [0, 1.5, 0]
      : TARGETS[scene]
  // Wrought-iron rails span almost the full window and are viewed in a
  // portrait card, so they need a wider fit than a normal curtain panel.
  const radius = scene === 'window' && variant === 'rail'
    ? 8.3
    : scene === 'window' && variant === 'bracket'
      ? 5.8
      : scene === 'sofa' && sizeVariant?.includes('60')
        ? 12.2
        : scene === 'bed' && sizeVariant?.includes('four-poster')
          ? 9.2
        : RADII[scene]

  useFrame((state, delta) => {
    const o = orbit.current
    const settled = Math.abs(o.toYaw - o.yaw) < 0.0005 && Math.abs(o.toPitch - o.pitch) < 0.0005
    if (settled) {
      o.yaw = o.toYaw
      o.pitch = o.toPitch
    } else {
      const t = reducedMotion() ? 1 : 1 - Math.exp(-9 * delta)
      o.yaw += (o.toYaw - o.yaw) * t
      o.pitch += (o.toPitch - o.pitch) * t
      invalidate()
    }

    state.camera.position.set(
      target[0] + Math.sin(o.yaw) * radius * Math.cos(o.pitch),
      HOME.height + Math.sin(o.pitch) * radius,
      target[2] + Math.cos(o.yaw) * radius * Math.cos(o.pitch),
    )
    state.camera.lookAt(...target)
  })

  return null
}

function ClothBox({
  colour,
  pattern,
  args,
  position,
  rotation,
  radius = 0.08,
}: {
  colour: string
  pattern: PatternKind
  args: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  radius?: number
}) {
  const source: MaterialSource = useMemo(
    () => ({ kind: 'procedural', pattern, colour, finishId: finishForPattern(pattern) }),
    [pattern, colour],
  )
  const material = useFabricMaterial(source)
  return (
    <RoundedBox
      args={args}
      radius={radius}
      smoothness={4}
      bevelSegments={3}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      material={material}
    />
  )
}

function DrapedCloth({
  colour,
  pattern,
  width,
  height,
  position,
  rotation,
  horizontal = false,
}: {
  colour: string
  pattern: PreviewProps['pattern']
  width: number
  height: number
  position: [number, number, number]
  rotation?: [number, number, number]
  horizontal?: boolean
}) {
  const source: MaterialSource = useMemo(
    () => ({ kind: 'procedural', pattern, colour, finishId: finishForPattern(pattern) }),
    [pattern, colour],
  )
  const material = useFabricMaterial(source)
  const geometry = useMemo(() => {
    const next = new PlaneGeometry(width, height, 32, 18)
    const vertices = next.attributes.position
    for (let i = 0; i < vertices.count; i += 1) {
      const x = vertices.getX(i)
      const y = vertices.getY(i)
      const across = x / width + 0.5
      const down = y / height + 0.5
      const folds = Math.cos(across * Math.PI * 10) * 0.035
      const relaxedHem = Math.sin(across * Math.PI) * (1 - down) * 0.075
      vertices.setZ(i, folds * (0.55 + (1 - down) * 0.45) + relaxedHem)
    }
    next.computeVertexNormals()
    return next
  }, [width, height])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation ?? (horizontal ? [-Math.PI / 2, 0, 0] : [0, 0, 0])}
      castShadow
      receiveShadow
    />
  )
}

function WoodBox({ args, position, colour = '#805c3d', radius = 0.05 }: { args: [number, number, number]; position: [number, number, number]; colour?: string; radius?: number }) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={3} bevelSegments={2} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={colour} roughness={0.72} />
    </RoundedBox>
  )
}

function Metal({
  colour,
  position,
  args = [0.07, 0.07, 0.07],
  rotation,
}: {
  colour: string
  position: [number, number, number]
  args?: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <mesh castShadow position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={colour} metalness={0.86} roughness={0.24} envMapIntensity={1.5} />
    </mesh>
  )
}

function Finial({ kind = 'ball', position, colour }: { kind?: PreviewProps['finial']; position: [number, number, number]; colour: string }) {
  if (kind === 'scroll') {
    return (
      <mesh position={position} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.16, 0.035, 12, 24]} />
        <meshStandardMaterial color={colour} metalness={0.9} roughness={0.22} />
      </mesh>
    )
  }
  if (kind === 'spear') {
    return (
      <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.16, 0.42, 4]} />
        <meshStandardMaterial color={colour} metalness={0.9} roughness={0.22} />
      </mesh>
    )
  }
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.16, 20, 12]} />
      <meshStandardMaterial color={colour} metalness={0.9} roughness={0.22} />
    </mesh>
  )
}

function WallArt({ position = [0, 2.4, -2.35] as [number, number, number], scale = [1.3, 0.8] as [number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[scale[0], scale[1], 0.06]} />
        <meshStandardMaterial color="#d8c9b6" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[scale[0] * 0.82, scale[1] * 0.78]} />
        <meshStandardMaterial color="#a8b7a8" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.42, 18]} />
        <meshStandardMaterial color="#b8754b" roughness={0.8} />
      </mesh>
      {[[-0.18, 0.48, 0], [0.04, 0.58, 0.02], [0.2, 0.46, -0.02]].map((leaf, i) => (
        <mesh key={i} position={leaf as [number, number, number]} rotation={[0, i * 0.8, (i - 1) * 0.35]} castShadow>
          <sphereGeometry args={[0.22, 10, 6]} />
          <meshStandardMaterial color="#71866b" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Rug({ position = [0, 0.015, 0] as [number, number, number], args = [4.3, 0.03, 3.2] as [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#c5b49f" roughness={1} />
    </mesh>
  )
}

function HangingTowel({ colour, pattern, width, height, position }: {
  colour: string
  pattern: PreviewProps['pattern']
  width: number
  height: number
  position: [number, number, number]
}) {
  const railY = 1.68
  return (
    <group>
      <DrapedCloth colour={colour} pattern={pattern} width={width} height={height} position={[position[0], railY - height / 2, position[2]]} />
      <ClothBox colour={colour} pattern={pattern} args={[width + 0.04, 0.09, 0.045]} position={[position[0], railY - 0.02, position[2] + 0.03]} radius={0.02} />
      <DrapedCloth colour={colour} pattern={pattern} width={width * 0.92} height={0.045} position={[position[0], railY - height + 0.04, position[2] + 0.01]} />
      {[-0.28, 0.28].map((offset) => (
        <mesh key={offset} position={[position[0] + width * offset, railY + 0.015, position[2] + 0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.07, 0.018, 8, 18]} />
          <meshStandardMaterial color={colour} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function BedScene({ colour, pattern, bedScale = 1, variant, sizeVariant, hardware = '#2c2c2c' }: PreviewProps) {
  const width = 2.8 * bedScale
  const depthScale = sizeVariant?.includes('king') ? 1.18 : sizeVariant?.includes('queen') ? 1.1 : sizeVariant?.includes('single') ? 0.88 : 1
  const depth = (value: number) => value * depthScale
  const canopyEnd = depth(1.13)
  const canopyDepth = depth(2.26)
  const framedNetHeight = 3.85
  const ceilingNetHeight = 3.1
  const darkWood = '#684b32'
  const isFourPoster = sizeVariant?.includes('four-poster')
  // A canopy is sheer mesh over opaque bedding. Reusing the sheer material for
  // the duvet makes the mattress show through and gives the sheet a plastic,
  // over-thick appearance.
  const beddingPattern = variant === 'canopy' ? 'plain' : pattern
  return (
    <group>
      <Rug position={[0, 0.02, 0.08]} args={[4.2, 0.035, 3.1]} />
      <WallArt position={[0, 2.45, -1.98]} />
      <WoodBox args={[width + 0.18, 0.32, depth(2.35)]} position={[0, 0.34, 0]} colour={darkWood} radius={0.08} />
      <WoodBox args={[width + 0.28, 1.65, 0.18]} position={[0, 1.12, -depth(1.08)]} colour="#79593e" radius={0.1} />

      {/* Mattress volume: the linen sits on this, not in mid-air above the bed base. */}
      <WoodBox args={[width - 0.08, 0.22, depth(2.08)]} position={[0, 0.57, 0.02]} colour="#e8e1d5" radius={0.09} />
      <DrapedCloth colour={colour} pattern={beddingPattern} width={width} height={depth(2.12)} position={[0, 0.67, 0.02]} horizontal />
      <ClothBox colour={colour} pattern={beddingPattern} args={[width + 0.05, 0.09, depth(0.64)]} position={[0, 0.68, depth(0.73)]} rotation={[0.035, 0, 0]} radius={0.04} />
      <ClothBox colour={colour} pattern={beddingPattern} args={[width * 0.42, 0.07, depth(0.58)]} position={[-width * 0.23, 0.8, -depth(0.62)]} rotation={[0.02, 0.04, -0.04]} radius={0.06} />
      <ClothBox colour={colour} pattern={beddingPattern} args={[width * 0.42, 0.07, depth(0.58)]} position={[width * 0.23, 0.8, -depth(0.62)]} rotation={[0.02, -0.04, 0.04]} radius={0.06} />

      {/* A small front fold gives the linen a soft fall instead of a single hard slab. */}
      <ClothBox colour={colour} pattern={beddingPattern} args={[width * 0.96, 0.06, depth(0.34)]} position={[0, 0.48, depth(1.06)]} rotation={[0.05, 0, 0]} radius={0.02} />

      {[-1, 1].map((side) => (
        <group key={side}>
          <WoodBox args={[0.12, 0.38, 0.12]} position={[side * (width / 2 - 0.22), 0.08, depth(0.88)]} colour={darkWood} />
          <WoodBox args={[0.12, 0.38, 0.12]} position={[side * (width / 2 - 0.22), 0.08, -depth(0.88)]} colour={darkWood} />
        </group>
      ))}

      {variant === 'canopy' && isFourPoster && (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Metal colour={hardware} position={[side * (width / 2 + 0.05), 2.25, -canopyEnd]} args={[0.09, 3.8, 0.09]} />
              <Metal colour={hardware} position={[side * (width / 2 + 0.05), 2.25, canopyEnd]} args={[0.09, 3.8, 0.09]} />
            </group>
          ))}
          <Metal colour={hardware} position={[0, 3.95, -canopyEnd]} args={[width + 0.2, 0.09, 0.09]} />
          <Metal colour={hardware} position={[0, 3.95, canopyEnd]} args={[width + 0.2, 0.09, 0.09]} />
          <DrapedCloth colour={colour} pattern={pattern} width={width + 0.2} height={canopyDepth} position={[0, 3.9, 0]} horizontal />
          {/* Hanging mesh panels make the mosquito canopy legible from orbit. */}
          <DrapedCloth colour={colour} pattern={pattern} width={width + 0.12} height={framedNetHeight} position={[0, framedNetHeight / 2, -canopyEnd]} />
          <DrapedCloth colour={colour} pattern={pattern} width={width + 0.12} height={framedNetHeight} position={[0, framedNetHeight / 2, canopyEnd]} />
          <DrapedCloth colour={colour} pattern={pattern} width={canopyDepth} height={framedNetHeight} position={[-width / 2, framedNetHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
          <DrapedCloth colour={colour} pattern={pattern} width={canopyDepth} height={framedNetHeight} position={[width / 2, framedNetHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
        </>
      )}
      {variant === 'canopy' && !isFourPoster && (
        <>
          <Metal colour={hardware} position={[0, 3.25, 0]} args={[0.08, 0.08, 0.08]} />
          <DrapedCloth colour={colour} pattern={pattern} width={width + 0.25} height={2.2} position={[0, 3.12, 0]} horizontal />
          <DrapedCloth colour={colour} pattern={pattern} width={width + 0.18} height={ceilingNetHeight} position={[0, ceilingNetHeight / 2, -canopyEnd]} />
          <DrapedCloth colour={colour} pattern={pattern} width={width + 0.18} height={ceilingNetHeight} position={[0, ceilingNetHeight / 2, canopyEnd]} />
          <DrapedCloth colour={colour} pattern={pattern} width={canopyDepth} height={ceilingNetHeight} position={[-width / 2, ceilingNetHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
          <DrapedCloth colour={colour} pattern={pattern} width={canopyDepth} height={ceilingNetHeight} position={[width / 2, ceilingNetHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
        </>
      )}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 + 0.62), 0, -0.55]}>
          <WoodBox args={[0.52, 0.72, 0.52]} position={[0, 0.52, -depth(0.55)]} colour="#805c3d" radius={0.05} />
          <mesh position={[0, 1.02, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.45, 16]} />
            <meshStandardMaterial color="#b6a998" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.28, 0]} castShadow>
            <coneGeometry args={[0.3, 0.28, 4]} />
            <meshStandardMaterial color="#e9dcc4" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function SofaScene({ colour, pattern, sizeVariant }: PreviewProps) {
  const cushionSize = sizeVariant?.includes('60') ? 1.22 : sizeVariant?.includes('50') ? 1.1 : sizeVariant?.includes('30-50') ? 0.82 : 1
  const cushionDepth = sizeVariant?.includes('30-50') ? 0.42 : 0.92
  return (
    <group>
      <Rug position={[0, 0.02, 0.22]} args={[4.7, 0.035, 3.3]} />
      <WallArt position={[0, 2.45, -1.98]} scale={[1.7, 0.95]} />
      <WoodBox args={[3.9 + (cushionSize - 1) * 2.4, 0.62, 1.25]} position={[0, 0.68, 0]} colour="#5e4733" radius={0.16} />
      <ClothBox colour="#8d9187" pattern="plain" args={[4.15 + (cushionSize - 1) * 2.4, 1.45, 0.5]} position={[0, 1.35, -0.43]} radius={0.2} />
      <ClothBox colour="#8d9187" pattern="plain" args={[0.42, 1.25, 1.5]} position={[-1.85 - (cushionSize - 1) * 1.2, 0.95, 0]} radius={0.18} />
      <ClothBox colour="#8d9187" pattern="plain" args={[0.42, 1.25, 1.5]} position={[1.85 + (cushionSize - 1) * 1.2, 0.95, 0]} radius={0.18} />
      {[-1.25, 0, 1.25].map((x, index) => (
        <ClothBox
          key={x}
          colour={colour}
          pattern={pattern}
          args={[1.02 * cushionSize, cushionDepth, 0.18]}
          position={[x * cushionSize, 1.12 + (index === 1 ? 0.04 : 0), 0.18]}
          rotation={[0.08, 0, (index - 1) * 0.06]}
          radius={0.12}
        />
      ))}
      {[-1.45, 1.45].map((x) => <WoodBox key={x} args={[0.16, 0.42, 0.16]} position={[x, 0.18, 0.34]} colour="#59422f" />)}
      <WoodBox args={[0.58, 0.72, 0.58]} position={[2.25, 0.48, -0.55]} colour="#805c3d" radius={0.06} />
      <Plant position={[2.25, 0.95, -0.55]} />
    </group>
  )
}

function BathScene({ colour, pattern, sizeVariant, productSlug }: PreviewProps) {
  const isCeramic = productSlug === 'ceramic-bathroom-set'
  const isEgyptianSet = productSlug === 'egyptian-cotton-towel-set'
  const isDecorPair = productSlug === 'decor-towel-pair'
  const towel = sizeVariant?.includes('pool')
    ? { width: 0.9, height: 1.05 }
    : sizeVariant?.includes('hand')
      ? { width: 0.42, height: 0.58 }
      : { width: 0.68, height: 0.9 }
  return (
    <group>
      <mesh position={[0, 2.35, -2.32]} receiveShadow>
        <boxGeometry args={[4.5, 3.4, 0.05]} />
        <meshStandardMaterial color="#e8eae7" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.1, -2.26]}>
        <planeGeometry args={[1.5, 1.1]} />
        <meshStandardMaterial color="#9faeac" metalness={0.35} roughness={0.2} />
      </mesh>
      <WoodBox args={[3.8, 0.16, 1.1]} position={[0, 1.18, -0.15]} colour="#d8d8d2" radius={0.04} />
      <mesh receiveShadow position={[0, 0.75, -0.38]}>
        <boxGeometry args={[2.2, 0.8, 0.75]} />
        <meshStandardMaterial color="#f7f6f1" roughness={0.3} />
      </mesh>
      {!isCeramic && (
        <>
          {/* The camera looks from positive z, so the rail sits behind the cloth. */}
          <Metal colour="#a9aca8" position={[0, 1.72, 0.82]} args={[3.1, 0.07, 0.07]} rotation={[0, 0, 0]} />
          <Metal colour="#a9aca8" position={[-1.48, 1.72, 0.62]} args={[0.07, 0.07, 0.42]} rotation={[Math.PI / 2, 0, 0]} />
          <Metal colour="#a9aca8" position={[1.48, 1.72, 0.62]} args={[0.07, 0.07, 0.42]} rotation={[Math.PI / 2, 0, 0]} />
        </>
      )}
      {!isCeramic && (isEgyptianSet ? (
        <>
          <HangingTowel colour={colour} pattern={pattern} width={0.58} height={0.86} position={[-1.05, 0, 0.76]} />
          <HangingTowel colour={colour} pattern={pattern} width={0.58} height={0.86} position={[-0.35, 0, 0.76]} />
          <HangingTowel colour={colour} pattern={pattern} width={0.38} height={0.52} position={[0.45, 0, 0.76]} />
          <HangingTowel colour={colour} pattern={pattern} width={0.38} height={0.52} position={[0.98, 0, 0.76]} />
        </>
      ) : isDecorPair ? (
        <>
          <HangingTowel colour={colour} pattern={pattern} width={0.62} height={0.82} position={[-0.52, 0, 0.76]} />
          <HangingTowel colour={colour} pattern={pattern} width={0.62} height={0.82} position={[0.32, 0, 0.76]} />
        </>
      ) : (
        <>
          <HangingTowel colour={colour} pattern={pattern} width={towel.width} height={towel.height} position={[-0.95, 0, 0.76]} />
          <HangingTowel colour={colour} pattern={pattern} width={towel.width * 0.86} height={towel.height * 0.68} position={[0.12, 0, 0.76]} />
        </>
      ))}
      {isCeramic && (
        <>
          {/* Soap dispenser: ceramic bottle, neck and metal pump. */}
          <mesh position={[-0.98, 1.52, 0.12]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.52, 24]} />
            <meshStandardMaterial color={colour} roughness={0.26} />
          </mesh>
          <mesh position={[-0.98, 1.84, 0.12]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.14, 20]} />
            <meshStandardMaterial color={colour} roughness={0.26} />
          </mesh>
          <mesh position={[-0.88, 1.93, 0.12]} castShadow>
            <boxGeometry args={[0.26, 0.05, 0.07]} />
            <meshStandardMaterial color="#b7b8b4" metalness={0.72} roughness={0.22} />
          </mesh>

          {/* Tumbler: a slightly tapered open ceramic cup. */}
          <mesh position={[-0.25, 1.46, 0.12]} castShadow>
            <cylinderGeometry args={[0.18, 0.14, 0.38, 24, 1, true]} />
            <meshStandardMaterial color={colour} roughness={0.26} side={2} />
          </mesh>

          {/* Soap dish and the bar of soap sitting inside it. */}
          <RoundedBox args={[0.58, 0.1, 0.38]} radius={0.12} smoothness={3} bevelSegments={3} position={[0.55, 1.31, 0.12]} castShadow>
            <meshStandardMaterial color={colour} roughness={0.26} />
          </RoundedBox>
          <RoundedBox args={[0.32, 0.08, 0.2]} radius={0.08} smoothness={3} bevelSegments={3} position={[0.55, 1.41, 0.12]} castShadow>
            <meshStandardMaterial color="#eee7d9" roughness={0.58} />
          </RoundedBox>

          {/* Brush holder with a visible brush handle and bristles. */}
          <mesh position={[1.22, 1.48, 0.12]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.44, 24]} />
            <meshStandardMaterial color={colour} roughness={0.26} />
          </mesh>
          <mesh position={[1.22, 1.86, 0.12]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.7, 12]} />
            <meshStandardMaterial color="#8d6b4b" roughness={0.52} />
          </mesh>
          <mesh position={[1.22, 2.18, 0.12]} castShadow>
            <coneGeometry args={[0.12, 0.25, 12]} />
            <meshStandardMaterial color="#d7d0bb" roughness={0.9} />
          </mesh>
        </>
      )}
      {!isCeramic && <WoodBox args={[0.62, 0.42, 0.62]} position={[-1.65, 0.28, -0.2]} colour="#ba835b" radius={0.08} />}
    </group>
  )
}

function DiningScene({ colour, pattern, sizeVariant }: PreviewProps) {
  const hasRunners = sizeVariant === 'set-of-6-2-runners'
  const placeSettings = [-1.12, 0, 1.12]
  return (
    <group>
      <Rug position={[0, 0.02, 0]} args={[5, 0.035, 3.8]} />
      <WallArt position={[0, 2.75, -1.98]} scale={[1.6, 0.9]} />
      <WoodBox args={[3.8, 0.24, 2.15]} position={[0, 1.2, 0]} colour="#a97c50" radius={0.13} />
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <WoodBox key={`${x}-${z}`} args={[0.16, 1.25, 0.16]} position={[x * 1.55, 0.54, z * 0.78]} colour="#805c3d" />))}
      {[-0.42, 0.42].flatMap((z) => placeSettings.map((x) => (
        <ClothBox key={`${x}-${z}`} colour={colour} pattern={pattern} args={[0.82, 0.018, 0.55]} position={[x, 1.36, z]} radius={0.01} />
      )))}
      {[-0.42, 0.42].flatMap((z) => placeSettings.map((x) => (
        <mesh key={`plate-${x}-${z}`} position={[x, 1.43, z]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.035, 32]} />
          <meshStandardMaterial color="#f5f1e8" roughness={0.3} />
        </mesh>
      )))}
      {hasRunners && [-0.58, 0.58].map((x) => (
          <ClothBox key={x} colour={colour} pattern={pattern} args={[0.16, 0.018, 1.78]} position={[x, 1.39, 0]} radius={0.01} />
      ))}
      {[-1.35, 1.35].map((x) => (
        <group key={x} position={[x, 0.62, 1.45]}>
          <WoodBox args={[0.7, 0.9, 0.62]} position={[0, 0, 0]} colour="#6f5138" radius={0.12} />
          <ClothBox colour="#9b9c91" pattern="plain" args={[0.72, 0.55, 0.18]} position={[0, 0.34, -0.06]} radius={0.08} />
        </group>
      ))}
      <Metal colour="#5c5c5c" position={[0, 3.35, -0.4]} args={[0.05, 1.1, 0.05]} />
      <mesh position={[0, 2.82, -0.4]} castShadow>
        <coneGeometry args={[0.52, 0.42, 32]} />
        <meshStandardMaterial color="#3f4a44" roughness={0.55} />
      </mesh>
    </group>
  )
}

function IronScene({ hardware, finial }: { hardware: string; finial?: PreviewProps['finial'] }) {
  return (
    <group>
      <mesh position={[0, 1.9, -0.15]} receiveShadow>
        <boxGeometry args={[4.6, 3.1, 0.08]} />
        <meshStandardMaterial color="#b9c7c8" roughness={0.35} metalness={0.05} />
      </mesh>
      <WoodBox args={[4.9, 0.18, 0.16]} position={[0, 3.55, -0.12]} colour="#70543b" radius={0.04} />
      <WoodBox args={[4.9, 0.18, 0.16]} position={[0, 0.25, -0.12]} colour="#70543b" radius={0.04} />
      <WoodBox args={[0.16, 3.5, 0.16]} position={[-2.35, 1.9, -0.12]} colour="#70543b" radius={0.04} />
      <WoodBox args={[0.16, 3.5, 0.16]} position={[2.35, 1.9, -0.12]} colour="#70543b" radius={0.04} />
      <WoodBox args={[0.14, 0.14, 0.05]} position={[0, 1.9, -0.17]} colour="#dce5e3" radius={0.02} />
      {/* The rail sits above the window casing, with brackets dropping from it. */}
      <Metal colour={hardware} position={[0, 3.82, 0.1]} args={[4.15, 0.1, 0.1]} />
      <Metal colour={hardware} position={[-1.78, 3.62, 0.02]} args={[0.12, 0.44, 0.18]} rotation={[0, 0, -0.25]} />
      <Metal colour={hardware} position={[1.78, 3.62, 0.02]} args={[0.12, 0.44, 0.18]} rotation={[0, 0, 0.25]} />
      <Finial kind={finial} colour={hardware} position={[-2.14, 3.82, 0.1]} />
      <Finial kind={finial} colour={hardware} position={[2.14, 3.82, 0.1]} />
    </group>
  )
}

function BracketScene({ hardware }: { hardware: string }) {
  return (
    <group>
      <mesh position={[0, 1.9, -0.12]} receiveShadow>
        <boxGeometry args={[4.6, 3.1, 0.08]} />
        <meshStandardMaterial color="#f0ece5" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.15, 1.45, 0.05]}>
          <Metal colour={hardware} position={[0, 0.45, 0]} args={[0.12, 1.25, 0.12]} />
          <Metal colour={hardware} position={[side * 0.36, 0.02, 0]} args={[0.82, 0.12, 0.12]} rotation={[0, 0, side * 0.32]} />
          <Metal colour={hardware} position={[side * 0.2, 0.28, 0]} args={[0.08, 0.75, 0.08]} rotation={[0, 0, side * 0.55]} />
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 20]} />
            <meshStandardMaterial color={hardware} metalness={0.9} roughness={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function AnimatedCurtainPanel({
  side,
  drawn = true,
  colour,
  pattern,
}: {
  side: -1 | 1
  drawn?: boolean
  colour: string
  pattern: PreviewProps['pattern']
}) {
  const mesh = useRef<Mesh>(null)
  const source: MaterialSource = useMemo(
    () => ({ kind: 'procedural', pattern, colour, finishId: finishForPattern(pattern) }),
    [pattern, colour],
  )
  const material = useFabricMaterial(source)
  const geometry = useMemo(() => {
    const next = new PlaneGeometry(1.22, 2.48, 48, 18)
    const position = next.attributes.position
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i)
      const y = position.getY(i)
      const fold = Math.cos((x / 1.22) * Math.PI * 10) * 0.045
      const loosen = 0.55 + 0.45 * (1 - (y + 1.24) / 2.48)
      position.setZ(i, fold * loosen)
    }
    next.computeVertexNormals()
    return next
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (!mesh.current) return
    const t = reducedMotion() ? 1 : 1 - Math.exp(-8 * delta)
    const targetX = side * (drawn ? 1.02 : 0.62)
    const targetScale = drawn ? 0.42 : 1
    mesh.current.position.x += (targetX - mesh.current.position.x) * t
    mesh.current.scale.x += (targetScale - mesh.current.scale.x) * t
  })

  return (
    <mesh ref={mesh} geometry={geometry} material={material} position={[side * 0.62, 1.27, -1.78]} castShadow receiveShadow />
  )
}

function WindowScene({ colour, pattern, hardware = '#2c2c2c', drawn = true, night = false }: PreviewProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.25, -1.9]}>
        <planeGeometry args={[2.2, 2.5, 72, 20]} />
        <meshStandardMaterial color={night ? '#1d2b43' : '#a9c5d1'} roughness={0.42} metalness={0.05} emissive={night ? '#07101e' : '#000000'} emissiveIntensity={night ? 0.35 : 0} />
      </mesh>
      <WoodBox args={[2.38, 0.1, 0.12]} position={[0, 2.54, -1.78]} colour="#70543b" radius={0.02} />
      <WoodBox args={[2.38, 0.1, 0.12]} position={[0, -0.04, -1.78]} colour="#70543b" radius={0.02} />
      <WoodBox args={[0.1, 2.58, 0.12]} position={[-1.14, 1.25, -1.78]} colour="#70543b" radius={0.02} />
      <WoodBox args={[0.1, 2.58, 0.12]} position={[1.14, 1.25, -1.78]} colour="#70543b" radius={0.02} />
      <WoodBox args={[0.06, 2.48, 0.08]} position={[0, 1.25, -1.78]} colour="#70543b" radius={0.015} />
      <Metal colour={hardware} position={[0, 2.62, -1.9]} args={[0.045, 0.045, 2.9]} rotation={[0, 0, Math.PI / 2]} />
      <AnimatedCurtainPanel side={-1} drawn={drawn} colour={colour} pattern={pattern} />
      <AnimatedCurtainPanel side={1} drawn={drawn} colour={colour} pattern={pattern} />
    </group>
  )
}

function SceneContents(props: PreviewProps) {
  if (props.scene === 'bed') return <BedScene {...props} />
  if (props.scene === 'sofa') return <SofaScene {...props} />
  if (props.scene === 'bath') return <BathScene {...props} />
  if (props.scene === 'dining') return <DiningScene {...props} />
  if (props.variant === 'rail') return <IronScene hardware={props.hardware ?? '#2c2c2c'} finial={props.finial} />
  if (props.variant === 'bracket') return <BracketScene hardware={props.hardware ?? '#2c2c2c'} />
  return <WindowScene {...props} />
}

export default function RoomScene3D(props: PreviewProps) {
  const invalidate = useThree((state) => state.invalidate)
  const { state: orbit, handlers } = useOrbitDrag(invalidate)

  return (
    <div className={props.className ?? 'relative h-full w-full'}>
      <View className="absolute inset-0 h-full w-full">
        <RequestFrame />
        <PerspectiveCamera makeDefault fov={40} near={0.2} far={40} />
        <CameraRig orbit={orbit} scene={props.scene} variant={props.variant} sizeVariant={props.sizeVariant} />
        <Stage night={props.night} />
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 16]} />
          <meshStandardMaterial color="#e2d7c8" roughness={0.85} />
        </mesh>
        <mesh receiveShadow position={[0, 2.4, -2.4]}>
          <planeGeometry args={[16, 8]} />
          <meshStandardMaterial color="#f3ede7" roughness={0.95} />
        </mesh>
        <SceneContents {...props} />
      </View>

      <div {...handlers} className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" aria-hidden />
      <p className="pointer-events-none absolute bottom-2.5 left-1/2 z-[21] -translate-x-1/2 rounded-full bg-ink/55 px-2.5 py-1 text-[11px] font-medium text-white/90" aria-hidden>
        Drag to look around
      </p>
    </div>
  )
}
