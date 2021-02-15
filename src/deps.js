let activeEffect;

class Dep {
  constructor(value) {
    this.subscribers = new Set();
    this._value = value;
  }

  get value() {
    this.depend();
    return this._value;
  }

  set value(newVal) {
    this._value = newVal;
    this.notify();
  }

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

const dep = new Dep("hello");

watchEffect(() => {
  console.log(dep.value);
});

dep.value = "changed";
