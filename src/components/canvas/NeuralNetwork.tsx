"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, Stars } from "@react-three/drei";
// @ts-ignore
import * as random from "maath/random/dist/maath-random.esm";

function ParticleCloud(props: any) {
    const ref = useRef<any>(null);
    // Generate 2000 random points in a sphere
    const [sphere] = useState(() => random.inSphere(new Float32Array(2000 * 3), { radius: 1.5 }));

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#00f0ff"
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

function Core(props: any) {
    const ref = useRef<any>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            const t = state.clock.getElapsedTime();
            ref.current.scale.x = 1 + Math.sin(t * 2) * 0.1;
            ref.current.scale.y = 1 + Math.sin(t * 2) * 0.1;
            ref.current.scale.z = 1 + Math.sin(t * 2) * 0.1;
        }
    });

    return (
        <mesh ref={ref} {...props}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.1} />
        </mesh>
    );
}

export default function NeuralNetwork() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 3] }}>
                <fog attach="fog" args={['#000', 2, 10]} />
                <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
                    <ParticleCloud />
                    <Core />
                </Float>
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
            </Canvas>
        </div>
    );
}
