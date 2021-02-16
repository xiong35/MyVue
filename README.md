
# My Vue

## 简介

尝试实现 [vue](https://cn.vuejs.org/) 的基本功能

## 用 vDom 的几个原因

1. 将平台和逻辑解耦合, 可以编写不同的渲染逻辑来将响应式对应到不同平台(Android / 桌面应用 / canvas / ssr)
2. React由于只触发更新, 而不能知道精确变化的数据, 所以需要diff来找出差异然后patch差异队列

## 创建 vdom

创建出一个对象来代表虚拟 dom

```js
// h for HyperScript
function h(tag, props, children) {
  return {
    tag,  // "div", "span", etc
    props,  // class, id, src, etc
    children,
  };
}
```

## 根据虚拟 dom 创建真实 dom

1. 根据 tag 创建 element
2. 将 props 添加到 element 上
3. 递归地创建 children

```js
function mount(vNode, container) {
  const el = (vNode.el = document.createElement(vNode.tag));

  // props
  if (vNode.props) {
    for (const key in vNode.props) {
      const value = vNode.props[key];
      if (key.startsWith("on")) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  // children
  if (vNode.children) {
    if (typeof vNode.children === "string") {
      el.textContent = vNode.children;
    } else {
      vNode.children.forEach((child) => {
        mount(child, el);
      });
    }
  }

  container.appendChild(el);
}
```

## 在数据变化时**按需**改变真实 dom

1. 比较新旧 vdom 树, 相同之处保留复用, 若仅为 props 不同则按需更改原 element, 若 tag 都变了则重新创建节点
2. 递归地 diff 子节点

```js
patch(n1, n2) {
  const el = (n2.el = n1.el);

  if (n1.tag === n2.tag) {
    // props
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    for (const key in newProps) {
      const oldVal = oldProps[key];
      const newVal = newProps[key];
      if (newVal !== oldVal) {
        el.setAttribute(key, newVal);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        el.removeAttribute(key);
      }
    }

    // children
    const oldChildren = n1.children;
    const newChildren = n2.children;
    if (typeof newChildren === "string") {
      if (typeof oldChildren === "string") {
        if (newChildren !== oldChildren) {
          el.textContent = newChildren;
        }
      } else {
        el.textContent = newChildren;
      }
    } else {
      if (typeof oldChildren === "string") {
        el.innerHTML = "";
        newChildren.forEach((child) => {
          mount(child, el);
        });
      } else {
        // TODO key?
        const commonLen = Math.min(
          oldChildren.length,
          newChildren.length
        );
        for (let i = 0; i < commonLen; i++) {
          patch(oldChildren[i], newChildren[i]);
        }
        if (newChildren.length > oldChildren.length) {
          newChildren
            .slice(oldChildren.length)
            .forEach((child) => {
              mount(child, el);
            });
        } else {
          oldChildren
            .slice(newChildren.length)
            .forEach((child) => {
              el.removeChild(child.el);
            });
        }
      }
    }
  } else {
    const parent = el.parentNode;
    mount(n2, parent);
    parent.removeChild(el);
  }
}
```
