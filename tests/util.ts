import { act } from "react-dom/test-utils";

export const waitForComponentToPaint = async (wrapper: any, time = 50) => {
  // @ts-ignore
  await act(async () => {
    wrapper.update?.();
    await new Promise((resolve) => {
      setTimeout(resolve, time);
    });
    wrapper.update?.();
  });
};
