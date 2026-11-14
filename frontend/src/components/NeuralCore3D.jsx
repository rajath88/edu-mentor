import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import "./NeuralCore3D.css";

function CoreParticles({ reducedMotion }) {
  const positions = useMemo(() => {
    const values = new Float32Array(24 * 3);
    for (let index = 0; index < 24; index++) {
      const angle = index * 2.399;
      const radius = 1.15 + ((index * 7) % 9) * 0.08;
      values[index * 3] = Math.cos(angle) * radius;
      values[index * 3 + 1] = Math.sin(angle) * radius;
      values[index * 3 + 2] = ((index % 5) - 2) * 0.22;
    }
    return values;
  }, []);

  return <points>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#ffd85b" size={0.025} sizeAttenuation transparent opacity={reducedMotion ? 0.42 : 0.72} />
  </points>;
}

function NeuralSculpture({ state, reducedMotion }) {
  const assembly = useRef(null);
  const core = useRef(null);
  const shell = useRef(null);
  const orbitA = useRef(null);
  const orbitB = useRef(null);
  const satellite = useRef(null);

  useFrame(({ clock, pointer }, frameDelta) => {
    if (reducedMotion) return;

    const delta = Math.min(frameDelta, 0.04);
    const speed = state === "thinking" ? 1.7 : state === "answering" ? 1.05 : 0.62;
    const time = clock.elapsedTime;

    if (assembly.current) {
      assembly.current.rotation.x += (pointer.y * 0.12 - assembly.current.rotation.x) * delta * 2;
      assembly.current.rotation.y += delta * (0.12 * speed + pointer.x * 0.05);
    }
    if (core.current) {
      const pulse = 1 + Math.sin(time * (state === "thinking" ? 2.4 : 1.15)) * 0.025;
      core.current.scale.setScalar(pulse);
      core.current.rotation.x += delta * 0.08 * speed;
    }
    if (shell.current) shell.current.rotation.y -= delta * 0.07 * speed;
    if (orbitA.current) orbitA.current.rotation.z += delta * 0.18 * speed;
    if (orbitB.current) orbitB.current.rotation.x -= delta * 0.11 * speed;
    if (satellite.current) {
      satellite.current.position.x = Math.cos(time * 0.5 * speed) * 1.38;
      satellite.current.position.y = Math.sin(time * 0.5 * speed) * 0.7;
    }
  });

  return (
    <group ref={assembly}>
      <pointLight position={[-2.3, 2.4, 2.6]} color="#fff1a6" intensity={8} distance={7} />
      <pointLight position={[2, -1.8, 1.5]} color="#ff9d00" intensity={4} distance={6} />

      <mesh ref={core}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshPhysicalMaterial color="#37332c" emissive="#b87900" emissiveIntensity={0.82}
          metalness={0.9} roughness={0.22} clearcoat={1} clearcoatRoughness={0.12} flatShading />
      </mesh>
      <mesh scale={0.42}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshPhysicalMaterial color="#ffd21a" emissive="#ffc400" emissiveIntensity={2.2}
          metalness={0.4} roughness={0.16} clearcoat={1} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[0.94, 1]} />
        <meshBasicMaterial color="#f4d675" wireframe transparent opacity={0.4} />
      </mesh>

      <mesh rotation={[0.4, 0.15, 0.2]}>
        <torusGeometry args={[0.82, 0.075, 10, 64]} />
        <meshStandardMaterial color="#45423c" metalness={0.96} roughness={0.22} />
      </mesh>
      <mesh rotation={[0.4, 0.15, 0.2]}>
        <torusGeometry args={[0.82, 0.018, 8, 64]} />
        <meshBasicMaterial color="#ffd600" />
      </mesh>

      <group position={[0, 0.02, 0.78]} rotation={[0.08, 0.12, Math.PI / 4]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.54, 0.045, 0.38]} />
          <meshPhysicalMaterial color="#ffd600" emissive="#b87900" emissiveIntensity={0.55} metalness={0.72} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.02, 0]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.09, 0.16, 0.16, 4]} />
          <meshStandardMaterial color="#e8ad00" metalness={0.76} roughness={0.24} />
        </mesh>
        <mesh position={[0.2, 0.09, 0.02]}>
          <cylinderGeometry args={[0.009, 0.009, 0.22, 6]} />
          <meshBasicMaterial color="#fff1a6" />
        </mesh>
      </group>

      <mesh ref={orbitA} rotation={[0.68, 0.3, 0.14]}>
        <torusGeometry args={[1.22, 0.012, 8, 100]} />
        <meshBasicMaterial color="#ffd600" transparent opacity={0.88} />
      </mesh>
      <mesh ref={orbitB} rotation={[1.15, 0.7, 0.25]}>
        <torusGeometry args={[1.42, 0.008, 8, 100]} />
        <meshBasicMaterial color="#d9d5ca" transparent opacity={0.5} />
      </mesh>

      <mesh ref={satellite} position={[1.38, 0, 0.08]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#fff2aa" emissive="#ffb800" emissiveIntensity={1.5}
          metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.12, -0.74, 0.12]} rotation={[0.3, 0.45, 0.1]}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshBasicMaterial color="#fff2aa" />
      </mesh>
      <CoreParticles reducedMotion={reducedMotion} />
    </group>
  );
}

function CoreFallback({ className }) {
  return (
    <div className={`neural-core-fallback ${className}`} aria-hidden="true">
      <span className="neural-fallback-ring neural-fallback-ring-one" />
      <span className="neural-fallback-ring neural-fallback-ring-two" />
      <span className="neural-fallback-shell"><i /></span>
    </div>
  );
}

export default function NeuralCore3D({ className = "", state = "idle", ...accessibilityProps }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return (
    <div className={`neural-core-3d ${className}`} {...accessibilityProps}>
      <Canvas camera={{ position: [0, 0, 4.8], fov: 42 }} dpr={[1, 1.3]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        fallback={<CoreFallback className={className} />}>
        <ambientLight intensity={0.58} />
        <NeuralSculpture state={state} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
