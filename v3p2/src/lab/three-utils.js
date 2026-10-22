import * as THREE from 'three';

export function glowTexture(inner = 'rgba(255,255,255,1)', size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function createEnvironment(renderer) {
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  return { env, dispose: () => pmrem.dispose() };
}

export function seeded(seed = 7) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
// Compiles shaders on the GPU driver's own threads (KHR_parallel_shader_compile) and resolves when they are linked.
// three's own compileAsync can throw on a material that ends up without a program, which would leave the caller
// waiting forever, so this version checks defensively and gives up after a few seconds.
export function compileAsync(renderer, scene, camera) {
  let materials;
  try {
    materials = renderer.compile(scene, camera);
  } catch {
    return Promise.resolve();
  }
  if (!materials || !renderer.extensions?.has?.('KHR_parallel_shader_compile')) return Promise.resolve();
  const t0 = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      let pending = 0;
      materials.forEach((m) => {
        const program = renderer.properties.get(m)?.currentProgram;
        if (program?.isReady && !program.isReady()) pending++;
      });
      if (!pending || performance.now() - t0 > 6000) resolve();
      else setTimeout(check, 16);
    };
    check();
  });
}

// Same, for full-screen-quad canvases that swap materials: every material is compiled before the first frame.
export async function precompile(renderer, scene, camera, quad, materials) {
  if (quad && materials?.length) {
    const keep = quad.material;
    for (const m of materials) {
      quad.material = m;
      await compileAsync(renderer, scene, camera);
    }
    quad.material = keep;
  } else {
    await compileAsync(renderer, scene, camera);
  }
}
