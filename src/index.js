function h(tag, props, children) {
  return {
    tag,
    props,
    children,
  };
}

function mount(vNode, container) {
  const el = document.createElement(vNode.tag);

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

const vNode = h("div", { class: "red" }, [
  h("span", null, "hello"),
]);

mount(vNode, document.getElementById("app"));
