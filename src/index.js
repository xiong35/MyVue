class MyVue {
  constructor(options = {}) {
    this.$el = document.querySelector(options.el);
    let data = (this.data = options.data);
    // 代理data，使其能直接this.xxx的方式访问data，正常的话需要this.data.xxx
    Object.keys(data).forEach((key) => {
      proxy(this, "data", key);
    });
    this.methods = options.methods; // 事件方法
    this.observeTasks = {}; // 需要监听的任务列表
    this.observe(data); // 初始化劫持监听所有数据
    this.compile(this.$el); // 解析dom
  }

  observe = (data) => {
    Object.keys(data).forEach((key) => {
      let value = data[key];
      this.observeTasks[key] = [];
      Object.defineProperty(data, key, {
        configurable: false,
        enumerable: true,
        get: () => {
          return value;
        },
        set: (newValue) => {
          if (newValue !== value) {
            value = newValue;
            console.log(this);
            this.observeTasks[key].forEach((task) => {
              task.notify();
            });
          }
        },
      });
    });
  };

  compile = (el) => {
    var nodes = el.childNodes;

    nodes.forEach((node) => {
      // text nodes
      if (node.nodeType === 3) {
        var text = node.textContent.trim();
        if (!text) return;
        this.compileText(node, "textContent");
      }
      // element node
      else if (node.nodeType === 1) {
        if (node.childNodes.length > 0) {
          this.compile(node);
        }

        if (
          node.hasAttribute("v-model") &&
          (node.tagName === "INPUT" || node.tagName === "TEXTAREA")
        ) {
          let attrVal = node.getAttribute("v-model");
          this.observeTasks[attrVal].push(
            new Watcher(node, this, attrVal, "value")
          );
          node.removeAttribute("v-model");
          node.addEventListener("input", () => {
            this.data[attrVal] = node.value;
          });
        }

        if (node.hasAttribute("v-html")) {
          let attrVal = node.getAttribute("v-html");
          this.observeTasks[attrVal].push(
            new Watcher(node, this, attrVal, "innerHTML")
          );
          node.removeAttribute("v-html");
        }

        this.compileText(node, "innerHTML");

        if (node.hasAttribute("v-on:click")) {
          let attrVal = node.getAttribute("v-on:click");

          node.removeAttribute("v-on:click");
          node.addEventListener("click", (e) => {
            this.methods[attrVal] &&
              this.methods[attrVal].call(this);
          });
        }
      }
    });
  };

  compileText = (node, type) => {
    let reg = /\{\{(.*?)\}\}/g,
      txt = node.textContent;
    if (reg.test(txt)) {
      node.textContent = txt.replace(reg, (matched, group1) => {
        let code = group1.trim();

        let tasks = this.observeTasks[code] || [];
        tasks.push(new Watcher(node, this, code, type));

        if (code.split(".").length > 1) {
          // 如果是形如 foo.bar 的代码, 就逐层找下去
          let v = null;
          code.split(".").forEach((val, i) => {
            v = v ? v[val] : this[val];
          });
          return v;
        } else {
          return this[code];
        }
      });
    }
  };
}

function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get() {
      return this[sourceKey][key];
    },
    set(val) {
      this[sourceKey][key] = val;
    },
  });
}

class Watcher {
  constructor(el, vm, value, type) {
    this.el = el;
    this.vm = vm;
    this.value = value;
    this.type = type;
    this.notify();
  }

  notify = () => {
    this.el[this.type] = this.vm.data[this.value];
  };
}

const vm = new MyVue({
  el: "#app",
  data: {
    form: 0,
    test: "<strong>我是粗体</strong>",
  },
  methods: {
    increment() {
      console.log(this.form);
      this.form = this.form * 1 + 1;
    },
  },
});
