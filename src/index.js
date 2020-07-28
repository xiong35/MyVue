import { diff, patch } from "./vDom";

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
    this.vDom = {
      tag: null,
      props: {},
      children: [],
    };
    this.compile(this.$el, this.vDom); // 解析dom
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
            this.observeTasks[key].forEach((task) => {
              task.notify();
            });
          }
        },
      });
    });
  };

  compile = (el, Vel) => {
    var nodes = el.childNodes;
    Vel.tag = el.tagName;

    nodes.forEach((node) => {
      let vNode = {
        tag: node.tagName,
        props: {},
        children: [],
      };
      // Vel.children.push(vNode);
      // text nodes
      if (node.nodeType === 3) {
        var text = node.textContent.trim();
        if (!text) node.parentNode.removeChild(node);
        this.compileText(Vel, "text", text);
        vNode.tag = "TEXT";
      }
      // element node
      else if (node.nodeType === 1) {
        // Vel.children.push(vNode);

        let attrs = node.getAttributeNames();

        attrs.forEach((attr) => {
          if (
            attr === "v-model" &&
            (node.tagName === "INPUT" ||
              node.tagName === "TEXTAREA")
          ) {
            let attrVal = node.getAttribute("v-model");
            this.observeTasks[attrVal].push(
              new Watcher(vNode, this, attrVal, "value")
            );
            node.addEventListener("input", () => {
              this.data[attrVal] = node.value;
            });
            vNode.props.value = node.value;
          } else if (attr === "v-html") {
            let attrVal = node.getAttribute("v-html");
            this.observeTasks[attrVal].push(
              new Watcher(vNode, this, attrVal, "innerHTML")
            );
            vNode.props.innerHTML = this.data[attrVal];
          } else if (attr.startsWith("v-on:")) {
            let event = attr.split(":")[1];
            let attrVal = node.getAttribute(attr);

            node.addEventListener(event, (e) => {
              this.methods[attrVal] &&
                this.methods[attrVal].call(this, e);
            });
          } else {
            vNode.props[attr] = node.getAttribute(attr);
            return;
          }
          node.removeAttribute(attr);
        });

        if (node.childNodes.length > 0) {
          this.compile(node, vNode);
        }
      }
    });
  };

  compileText = (vNode, type, text) => {
    let reg = /\{\{(.*?)\}\}/g;
    if (reg.test(text)) {
      vNode.children.push(
        text.replace(reg, (matched, group1) => {
          let code = group1.trim();

          let tasks = this.observeTasks[code] || [];
          tasks.push(new Watcher(vNode, this, code, type));

          if (code.split(".").length > 1) {
            // 如果是形如 foo.bar 的代码, 就逐层找下去
            let v = null;
            // foo[0]无法处理
            code.split(".").forEach((val) => {
              v = v ? v[val] : this[val];
            });
            return v;
          } else {
            return this[code];
          }
        })
      );
    } else {
      vNode.children.push(text);
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

var timeout = null;

class Watcher {
  constructor(vNode, vm, code, type) {
    this.vNode = vNode;
    this.vm = vm;
    this.code = code;
    this.type = type;
    // this.notify();
  }

  notify = () => {
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = null;
    }, 20);
    // debugger;

    let oldTree = JSON.parse(JSON.stringify(this.vm.vDom));
    let v = null;
    // foo[0]无法处理
    this.code.split(".").forEach((val) => {
      v = v ? v[val] : this.vm[val];
    });
    if (this.type === "text") {
      this.vNode.children[0] = v;
    } else if (this.type === "value") {
      this.vNode.props.value = v;
    } else if (this.type === "innerHTML") {
      this.vNode.props.innerHTML = v;
    }
    console.log("vm:", this.vm);
    let patchObj = diff(oldTree, this.vm.vDom);
    console.log("patchObj:", patchObj);
    debugger;
    // patch(this.vm.$el, patchObj);
    patch(document.getElementById("parent"), patchObj);
  };
}

var vm = new MyVue({
  el: "#app",
  data: {
    form: 0,
    test: "<strong>我是粗体</strong>",
  },
  methods: {
    increment(e) {
      this.form = this.form * 1 + 1;
    },
  },
});

console.log(vm);
