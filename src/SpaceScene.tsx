import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Chart } from './engine';
export default function SpaceScene({ chart, onUnavailable }: {
    chart: Chart;
    onUnavailable: () => void;
}) {
    const host = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!host.current)
            return;
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        }
        catch {
            onUnavailable();
            return;
        }
        const el = host.current;
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
        camera.position.set(0, 0, 22);
        const loader = new THREE.TextureLoader(), textures: THREE.Texture[] = [], materials: THREE.Material[] = [], geometries: THREE.BufferGeometry[] = [];
        const group = new THREE.Group();
        scene.add(group);
        chart.placements.filter(p => !['rahu', 'ketu'].includes(p.key)).forEach((p, i) => {
            const size=p.key==='sun'?1.5:p.key==='jupiter'?1.25:.85;
            const tex = loader.load(`/assets/${p.key}.jpg`, image=>{sprite.scale.set(size*image.image.width/image.image.height,size,1)});
            tex.colorSpace = THREE.SRGBColorSpace;
            textures.push(tex);
            const material = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, depthWrite:false, alphaTest:.015 });
            material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.a *= smoothstep(0.008, 0.09, max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)));')};
            materials.push(material);
            const sprite = new THREE.Sprite(material);
            const angle = p.longitude * Math.PI / 180;
            const radius = 4.1 + i * .36;
            sprite.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, (i - 3) * .28);
            sprite.scale.setScalar(p.key === 'sun' ? 1.5 : p.key === 'jupiter' ? 1.25 : .85);
            group.add(sprite);
            const points = [new THREE.Vector3(0, 0, -.4), new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -.4)];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            geometries.push(geo);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xb6a274, transparent: true, opacity: .23 });
            materials.push(lineMat);
            group.add(new THREE.Line(geo, lineMat));
        });
        const circle = new THREE.EllipseCurve(0, 0, 7.3, 7.3, 0, Math.PI * 2, false, 0);
        const ringGeo = new THREE.BufferGeometry().setFromPoints(circle.getPoints(160));
        geometries.push(ringGeo);
        const ringMat = new THREE.LineBasicMaterial({ color: 0x9c88bc, transparent: true, opacity: .3 });
        materials.push(ringMat);
        group.add(new THREE.LineLoop(ringGeo, ringMat));
        const centerGeo = new THREE.RingGeometry(.16, .2, 32);
        geometries.push(centerGeo);
        const centerMat = new THREE.MeshBasicMaterial({ color: 0xd8bb87, side: THREE.DoubleSide });
        materials.push(centerMat);
        group.add(new THREE.Mesh(centerGeo, centerMat));
        const start = performance.now();
        let frame = 0;
        let stopped = false;
        const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        function render(now: number) { if (stopped)
            return; const t = Math.min((now - start) / 6500, 1), ease = 1 - Math.pow(1 - t, 3); camera.position.z = Math.max(22,20/camera.aspect) + (1-ease)*10; camera.position.x = (1 - ease) * 8; camera.lookAt(0, 0, 0); group.rotation.z = (1 - ease) * -.7; group.rotation.x = (1 - ease) * .75; renderer.render(scene, camera); frame = requestAnimationFrame(render); }
        frame = requestAnimationFrame(render);
        const lost = (event: Event) => { event.preventDefault(); stopped = true; cancelAnimationFrame(frame); onUnavailable(); };
        renderer.domElement.addEventListener('webglcontextlost', lost);
        return () => { stopped = true; cancelAnimationFrame(frame); ro.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', lost); textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose()); renderer.dispose(); renderer.domElement.remove(); };
    }, [chart, onUnavailable]);
    return <div className="space-canvas" ref={host} aria-hidden="true"/>;
}
