function h(tag, props, children) {
  return {
    tag,
    props,
    children,
  };
}

function mount(vNode, container) {
  const el = (vNode.el = document.createElement(vNode.tag));

  // props
  if (vNode.props) {
    for (const key in vNode.props) {
      const value = vNode.props[key];
      el.setAttribute(key, value);
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

function patch(n1, n2) {
  const el = n1.el;

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

const vNode = h("div", { class: "red" }, [
  h("span", null, "hello"),
]);

const vNode2 = h("div", { class: "green" }, [h("p", null, "wow")]);

mount(vNode, document.getElementById("app"));

patch(vNode, vNode2);
