import Enzyme from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import "jest-canvas-mock";

import React from "react";

global.React = React;

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useLayoutEffect: jest.requireActual("react").useEffect,
}));

jest.setTimeout(60000);

Enzyme.configure({ adapter: new Adapter() });

Object.defineProperty(window, "open", {
  value: jest.fn,
});

global.requestAnimationFrame =
  global.requestAnimationFrame ||
  function requestAnimationFrame(cb) {
    return setTimeout(cb, 0);
  };

global.cancelAnimationFrame =
  global.cancelAnimationFrame ||
  function cancelAnimationFrame() {
    return null;
  };

// browserMocks.js
export const localStorageMock = (() => {
  let store = {
    locale: "zh",
  };

  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      store[key] = null;
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, "cancelAnimationFrame", {
  value: () => null,
});

Math.random = () => 0.8404419276253765;

global.URL.createObjectURL = () => {};
