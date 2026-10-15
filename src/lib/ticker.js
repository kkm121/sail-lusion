const tasks = [];
let raf = 0;
let last = 0;

export const clock = { time: 0, dt: 1 / 60 };

function loop(time) {
  if (!tasks.length) {
    raf = 0;
    last = 0;
    return;
  }
  raf = requestAnimationFrame(loop);
  const dt = last ? Math.min((time - last) / 1000, 0.1) : 1 / 60;
  last = time;
  clock.time = time;
  clock.dt = dt;
  for (let i = 0; i < tasks.length; i++) tasks[i].fn(time, dt);
}

// One frame loop for the whole site. Lower order runs first:
// 0 scroll, 5 scroll-linked DOM, 10 layout-free effects, 20+ canvases.
export function onTick(fn, order = 0) {
  const task = { fn, order };
  tasks.push(task);
  tasks.sort((a, b) => a.order - b.order);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    const i = tasks.indexOf(task);
    if (i >= 0) tasks.splice(i, 1);
  };
}
