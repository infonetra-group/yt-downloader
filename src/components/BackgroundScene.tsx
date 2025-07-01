import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleFieldProps {
  downloadStatus: string;
}

function ParticleField({ downloadStatus }: ParticleFieldProps) {
  const ref = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const particleCount = 2000;
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  const colors = useMemo(() => {
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      let baseColor;
      
      switch (downloadStatus) {
        case 'fetching':
          baseColor = new THREE.Color(0x4f46e5); // Indigo
          break;
        case 'starting':
          baseColor = new THREE.Color(0x3b82f6); // Blue
          break;
        case 'downloading':
          baseColor = new THREE.Color(0x10b981); // Emerald
          break;
        case 'finishing':
          baseColor = new THREE.Color(0xf59e0b); // Amber
          break;
        case 'finished':
          baseColor = new THREE.Color(0x22c55e); // Green
          break;
        case 'error':
          baseColor = new THREE.Color(0xef4444); // Red
          break;
        default:
          baseColor = new THREE.Color(0x8b5cf6); // Purple
      }
      
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }
    return colors;
  }, [downloadStatus]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
      
      // Enhanced animations based on download status
      switch (downloadStatus) {
        case 'fetching':
          ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
          break;
        case 'starting':
          ref.current.rotation.z = state.clock.elapsedTime * 0.08;
          break;
        case 'downloading':
          ref.current.rotation.z = state.clock.elapsedTime * 0.15;
          break;
        case 'finishing':
          ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
          break;
        case 'finished':
          ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
          ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
          break;
        case 'error':
          ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
          break;
      }
    }
  });

  const getParticleColor = () => {
    switch (downloadStatus) {
      case 'fetching': return '#4f46e5';
      case 'starting': return '#3b82f6';
      case 'downloading': return '#10b981';
      case 'finishing': return '#f59e0b';
      case 'finished': return '#22c55e';
      case 'error': return '#ef4444';
      default: return '#8b5cf6';
    }
  };

  return (
    <Points ref={ref} positions={positions} colors={colors}>
      <PointMaterial
        transparent
        color={getParticleColor()}
        size={downloadStatus === 'finished' ? 0.03 : 0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={downloadStatus === 'downloading' ? 0.9 : 0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingOrbs({ downloadStatus }: ParticleFieldProps) {
  const orbs = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      ] as [number, number, number],
      speed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  return (
    <>
      {orbs.map((orb) => (
        <Orb key={orb.id} {...orb} downloadStatus={downloadStatus} />
      ))}
    </>
  );
}

function Orb({ position, speed, phase, downloadStatus }: {
  position: [number, number, number];
  speed: number;
  phase: number;
  downloadStatus: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + phase) * 2;
      
      const baseOpacity = downloadStatus === 'downloading' ? 0.15 : 0.1;
      ref.current.material.opacity = baseOpacity + Math.sin(state.clock.elapsedTime * speed * 2 + phase) * 0.1;
      
      if (downloadStatus === 'finished') {
        ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3 + phase) * 0.2);
      }
    }
  });

  const getOrbColor = () => {
    switch (downloadStatus) {
      case 'fetching': return '#4f46e5';
      case 'starting': return '#3b82f6';
      case 'downloading': return '#10b981';
      case 'finishing': return '#f59e0b';
      case 'finished': return '#22c55e';
      case 'error': return '#ef4444';
      default: return '#8b5cf6';
    }
  };

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial 
        color={getOrbColor()} 
        transparent 
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function BackgroundScene({ downloadStatus }: ParticleFieldProps) {
  const getBackgroundGradient = () => {
    switch (downloadStatus) {
      case 'fetching':
        return 'from-indigo-900 via-purple-900 to-blue-900';
      case 'starting':
        return 'from-blue-900 via-indigo-900 to-purple-900';
      case 'downloading':
        return 'from-emerald-900 via-green-900 to-teal-900';
      case 'finishing':
        return 'from-amber-900 via-orange-900 to-yellow-900';
      case 'finished':
        return 'from-green-900 via-emerald-900 to-teal-900';
      case 'error':
        return 'from-red-900 via-rose-900 to-pink-900';
      default:
        return 'from-purple-900 via-blue-900 to-indigo-900';
    }
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${getBackgroundGradient()} transition-all duration-1000`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <ParticleField downloadStatus={downloadStatus} />
        <FloatingOrbs downloadStatus={downloadStatus} />
      </Canvas>
      
      {/* Enhanced overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
    </div>
  );
}