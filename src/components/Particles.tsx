import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointsNodeMaterial } from 'three/webgpu';
import { attribute, float, vec3, mix } from 'three/tsl';
import { TINTS } from '../constants';
import { useSceneStore, sharedState } from '../store';

const PARTICLE_COUNT = 4000;

const Particles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const lightRef  = useRef<THREE.PointLight>(null);
  const tempVec   = useRef(new THREE.Vector3());

  const material = useMemo(() => {
    const mat = new PointsNodeMaterial();
    mat.transparent = true;
    mat.depthWrite  = false;
    mat.depthTest   = false;
    mat.blending    = THREE.AdditiveBlending;
    mat.toneMapped  = false;

    const vAge = attribute('age', 'float').div(attribute('lifespan', 'float'));

    // birthColor: color del guide en el momento de nacer — se mantiene toda la vida
    // al morir transiciona al amarillo original
    mat.colorNode   = mix(attribute('birthColor', 'vec3'), vec3(1.0, 0.85, 0.1), vAge);
    mat.opacityNode = float(1.0).sub(vAge).max(float(0.0));
    mat.sizeNode    = float(1.0).sub(vAge).mul(60.0).max(float(1.0));

    return mat;
  }, []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      temp.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        age: 0,
        lifespan: Math.random() * 0.6 + 0.3,
      });
    }
    return temp;
  }, []);

  const positions   = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const ages        = useMemo(() => new Float32Array(PARTICLE_COUNT), []);
  const lifespans   = useMemo(() => new Float32Array(PARTICLE_COUNT), []);
  const birthColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3).fill(1), []);

  useEffect(() => {
    return () => { material.dispose(); };
  }, [material]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const target = sharedState.guidePos;
    const tint   = TINTS[useSceneStore.getState().guideColorIndex];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = particles[i];
      particle.age += delta;

      if (particle.age > particle.lifespan) {
        particle.age = 0;
        const spread = 0.7;
        particle.position.set(
          target.x + (Math.random() - 0.5) * spread,
          target.y + (Math.random() - 0.5) * spread,
          target.z + (Math.random() - 0.5) * spread,
        );
        const speed = Math.random() * 1 + 0.5;
        particle.velocity.set(
          (Math.random() - 0.5) * 0.5,
          speed,
          (Math.random() - 0.5) * 0.5
        );
        // Snapshot del color actual al nacer
        const i3 = i * 3;
        birthColors[i3]     = tint[0];
        birthColors[i3 + 1] = tint[1];
        birthColors[i3 + 2] = tint[2];
      }

      tempVec.current.copy(particle.velocity).multiplyScalar(delta);
      particle.position.add(tempVec.current);

      const i3 = i * 3;
      positions[i3]     = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;
      ages[i]           = particle.age;
      lifespans[i]      = particle.lifespan;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate   = true;
    pointsRef.current.geometry.attributes.age.needsUpdate        = true;
    pointsRef.current.geometry.attributes.lifespan.needsUpdate   = true;
    pointsRef.current.geometry.attributes.birthColor.needsUpdate = true;

    if (lightRef.current) {
      lightRef.current.position.copy(target);
      lightRef.current.color.setRGB(tint[0], tint[1], tint[2]);
    }
  });

  return (
    <>
      <pointLight ref={lightRef} color={0xffdd22} intensity={60} distance={12} decay={2} />
      <points ref={pointsRef} frustumCulled={false} material={material}>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position"   count={PARTICLE_COUNT} array={positions}   itemSize={3} />
          <bufferAttribute attach="attributes-age"        count={PARTICLE_COUNT} array={ages}        itemSize={1} />
          <bufferAttribute attach="attributes-lifespan"   count={PARTICLE_COUNT} array={lifespans}   itemSize={1} />
          <bufferAttribute attach="attributes-birthColor" count={PARTICLE_COUNT} array={birthColors} itemSize={3} />
        </bufferGeometry>
      </points>
    </>
  );
};

export default Particles;
