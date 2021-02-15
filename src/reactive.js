let activeEffect;

class Dep {
  subscribers = new Set();

  depend() {
    if (activeEffect) {
      this.subscribers.add(activeEffect);
    }
  }

  notify() {
    this.subscribers.forEach((effect) => effect());
  }
}

function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}

const dep = new Dep();

watchEffect(() => {
  dep.depend();
  console.log("effect run");
});

dep.notify();
