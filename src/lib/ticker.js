const tasks = [];
let raf = 0;

function loop(time) {
  if (!tasks.length) {
    raf = 0;
    return;
  }
  raf = requestAnimationFrame(loop);
  for (let i = 0; i < tasks.length; i++) tasks[i].fn(time);
}

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
