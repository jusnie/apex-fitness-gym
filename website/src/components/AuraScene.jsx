import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function KineticMark() {
  const core = useRef()
  const ring = useRef()
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    core.current.rotation.x += delta * 0.16
    core.current.rotation.y += delta * 0.32
    ring.current.rotation.z -= delta * 0.22
    ring.current.rotation.x = Math.sin(t * 0.35) * 0.35
  })

  return (
    <Float speed={1.5} rotationIntensity={0.38} floatIntensity={0.65}>
      <group rotation={[0.3, -0.45, 0]}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1.45, 3]} />
          <meshStandardMaterial color="#e51d2b" metalness={0.78} roughness={0.18} emissive="#4d0007" emissiveIntensity={0.7} />
        </mesh>
        <mesh ref={ring} rotation={[0.85, 0.1, 0]}>
          <torusGeometry args={[2.05, 0.033, 12, 80]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.82} />
        </mesh>
        <mesh rotation={[1.55, 0.58, 0]}>
          <torusGeometry args={[2.42, 0.017, 10, 72]} />
          <meshBasicMaterial color="#e51d2b" transparent opacity={0.75} />
        </mesh>
      </group>
    </Float>
  )
}

export default function AuraScene() {
  return (
    <div className="aura-scene" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6.6], fov: 43 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[2.5, 3, 3]} color="#ff4853" intensity={30} distance={11} />
        <pointLight position={[-4, -2, 2]} color="#ffffff" intensity={9} distance={8} />
        <KineticMark />
        <Sparkles count={95} scale={7} size={2} speed={0.4} color={new THREE.Color('#ff3845')} />
      </Canvas>
    </div>
  )
}
