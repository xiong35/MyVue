import { h, mount, patch } from "./dom";
import { reactive, watchEffect } from "./reactive";

function mountApp(component, container) {
  let isMounted = false;
  let prevVDom;
  watchEffect(() => {
    if (!isMounted) {
      prevVDom = component.render();
      mount(prevVDom, container);
      isMounted = true;
    } else {
      const newVDom = component.render();
      patch(prevVDom, newVDom);
      prevVDom = newVDom;
    }
  });
}

const App = {
  data: reactive({
    count: 0,
  }),
  render() {
    return h(
      "div",
      {
        onClick: () => {
          this.data.count++;
        },
      },
      String(this.data.count)
    );
  },
};

mountApp(App, document.getElementById("app"));
