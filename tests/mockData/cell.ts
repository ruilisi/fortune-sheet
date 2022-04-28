export function cellPs(props = { value: "", isShow: false }) {
  return {
    left: null,
    top: null,
    width: null,
    height: null,
    ...props,
  };
}
export function editingCommentBox(props = { r: 0, c: 0 }) {
  return {
    ...props,
    autoFocus: true,
    height: 84,
    left: 92,
    rc: `${props.r}_${props.c}`,
    size: {
      fromX: 23,
      fromY: 7,
      height: 12,
      left: 69,
      toX: 5,
      toY: 5,
      top: -5,
      width: 28,
    },
    top: 2,
    value: "",
    width: 144,
  };
}
