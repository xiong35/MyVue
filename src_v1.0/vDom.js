const nodePatchTypes = {
  CREATE: "create node",
  REMOVE: "remove node",
  REPLACE: "replace node",
  UPDATE: "update node",
  INSERT: "insert node",
};

const propPatchTypes = {
  REMOVE: "remove prop",
  UPDATE: "update prop",
};

var createElement = (vDom) => {
  if (typeof vDom === "string" || typeof vDom === "number") {
    return document.createTextNode(vDom);
  }

  const { tag, props, children } = vDom;

  const element = document.createElement(tag);

  for (let propName in props) {
    element.setAttribute(propName, props[propName]);
  }

  if (children) {
    children
      .map(createElement)
      .forEach(element.appendChild.bind(element));
  }
  return element;
};

var toVDom = (tag, props, ...children) => {
  return {
    tag,
    props: props || {},
    children: [].concat.apply([], children) || [],
  };
};

export var diff = (vDomOld, vDomNew) => {
  // debugger;
  // add
  if (!vDomOld) {
    return {
      type: nodePatchTypes.CREATE,
      vDom: vDomNew,
    };
  }

  // del
  if (!vDomNew) {
    return { type: nodePatchTypes.REMOVE };
  }

  // replace
  if (
    typeof vDomOld !== typeof vDomNew ||
    ((typeof vDomOld === "string" ||
      typeof vDomOld === "number") &&
      vDomOld !== vDomNew) ||
    vDomOld.tag !== vDomNew.tag
  ) {
    return {
      type: nodePatchTypes.REPLACE,
      vDom: vDomNew,
    };
  }

  // update child
  if (vDomOld.tag) {
    const propsDiff = _diffProps(vDomOld, vDomNew);
    const { children, moves } = _diffChildren(vDomOld, vDomNew);

    if (
      propsDiff.length > 0 ||
      children.some((patch) => !!patch)
    ) {
      return {
        type: nodePatchTypes.UPDATE,
        props: propsDiff,
        moves,
        children,
      };
    }
  }
};

var _diffProps = (vDomOld, vDomNew) => {
  const patches = [];
  const allProps = { ...vDomOld.props, ...vDomNew.props };

  for (let propName in allProps) {
    const oldVal = vDomOld.props[propName];
    const newVal = vDomNew.props[propName];

    // del
    if (!newVal) {
      patches.push({
        type: propPatchTypes.REMOVE,
      });
    }
    // update
    else if (!oldVal || oldVal !== newVal) {
      patches.push({
        type: propPatchTypes.UPDATE,
        propName,
        value: newVal,
      });
    }
  }
  return patches;
};

var _diffChildren = (vDomOld, vDomNew) => {
  const patches = new Array(vDomNew.children.length);
  const moves = new Array(vDomOld.children.length);
  /* 
    node obj:
    {
      oldInd: <number>
      vDom: <vDom>
    }
    */

  const nodesWithKey = {};

  const nodesWithoutKey = [];
  let noKeyInd = 0;

  const oldChildren = vDomOld.children;

  const newChildren = vDomNew.children;

  let lastIndex = 0;

  // 将子元素分成有key和没key两组
  oldChildren.forEach((child, ind) => {
    const props = child.props;

    if (props !== undefined && props.key !== undefined) {
      nodesWithKey[props.key] = {
        oldInd: ind,
        vDom: child,
      };
    } else {
      nodesWithoutKey[noKeyInd++] = {
        oldInd: ind,
        vDom: child,
      };
    }
  });

  // 插入 / 更新新元素, 移动老元素
  newChildren.forEach((newChild, newInd) => {
    // 找能不能复用
    let oldObj;
    if (newChild && newChild.props && newChild.props.key) {
      oldObj = nodesWithKey[newChild.props.key];
      // 设置 key 被用过了
      nodesWithKey[newChild.props.key] = undefined;
    } else {
      // 尝试找到没有 key 的相同元素, 找到就复用, 找不到就插入
      oldObj = nodesWithoutKey.find((obj, ind) => {
        if (obj && _sameVnodeType(obj.vDom, newChild)) {
          nodesWithoutKey[ind] = undefined;
          return true;
        }
      });
    }
    // 移动 / 插入 元素
    if (!oldObj) {
      // 如果对应的 key 没有旧元素可复用
      // 就在新元素的位置创建并 插入 元素
      patches[newInd] = {
        insert: true,
        rDom: createElement(newChild),
        at: newInd,
      };
    } else {
      if (oldObj.oldInd < lastIndex) {
        /* 当前节点在老集合中的位置与 lastIndex 进行比较，
           if (child.oldInd >= lastIndex)，
           说明老元素中, 他前面的节点都被处理过 / 将要被处理
           他自己只要顺位往前排就好了, 不会有人插到前面
           则不进行节点移动操作，否则执行该操作 */
        moves[oldObj.oldInd] = {
          type: nodePatchTypes.INSERT,
          from: oldObj.oldInd,
          at: newInd,
        };
      }
      lastIndex = Math.max(oldObj.oldInd, lastIndex);
      // 移动后如何更新新dom
      patches[newInd] = diff(oldObj.vDom, newChild);
    }
  });

  // 清理未被复用的元素
  for (let key in nodesWithKey) {
    let oldObj = nodesWithKey[key];
    if (oldObj) {
      moves[oldObj.oldInd] = {
        type: nodePatchTypes.REMOVE,
        from: oldObj.oldInd,
      };
    }
  }
  for (let ind = 0; ind < nodesWithKey.length; ind++) {
    let oldObj = nodesWithKey[ind];
    if (oldObj) {
      moves[oldObj.oldInd] = {
        type: nodePatchTypes.REMOVE,
        from: oldObj.oldInd,
      };
    }
  }

  return { children: patches, moves };
};

export var patch = (parent, patchObj, index = 0) => {
  if (!patchObj || !parent) {
    return;
  }

  // insert
  if (patchObj.insert) {
    let atNode = parent.childNodes[patchObj.at];
    parent.insertBefore(patchObj.rDom, atNode);
  }

  // create
  else if (patchObj.type === nodePatchTypes.CREATE) {
    return parent.appendChild(createElement(patchObj.vDom));
  }

  const siblings = parent.childNodes;
  const element = siblings[index];

  // delete
  if (patchObj.type === nodePatchTypes.REMOVE) {
    return parent.removeChild(element);
  }
  // replace
  else if (patchObj.type === nodePatchTypes.REPLACE) {
    return parent.replaceChild(
      createElement(patchObj.vDom),
      element
    );
  }

  // update
  else if (patchObj.type === nodePatchTypes.UPDATE) {
    const { props, children, moves } = patchObj;
    _patchProps(element, props);

    // move
    if (moves) {
      const toRemove = [];

      moves.forEach((obj) => {
        if (obj) {
          if (obj.type === nodePatchTypes.INSERT) {
            children[obj.to] = children[obj.to] || {};

            children[obj.to].rDom = siblings[obj.from];
            children[obj.to].insert = true;
            children[obj.to].at = obj.at;
          }
          toRemove.push(siblings[obj.from]);
        }
      });

      toRemove.forEach((el) => {
        if (el) el.parentNode.removeChild(el);
      });
    }

    children.forEach((obj, ind) => {
      patch(element, obj, ind);
    });
  }
};

var _patchProps = (element, props) => {
  if (!props) {
    return;
  }

  props.forEach((obj) => {
    // del
    if (obj.type === propPatchTypes.REMOVE) {
      element.removeAttribute(patchObj.propName);
    }
    // create / update
    else if (obj.type === propPatchTypes.UPDATE) {
      // debugger;
      element[obj.propName] = obj.value;
    }
  });
};

var _sameVnodeType = (a, b) => {
  let aType = typeof a;
  let bType = typeof b;
  if (aType === "undefined" || bType === "undefined") {
    return false;
  }
  if (
    (aType === "string" || aType === "number") &&
    (bType === "string" || bType === "number")
  ) {
    return true;
  }
  return a.key === b.key && a.tag === b.tag;
};
