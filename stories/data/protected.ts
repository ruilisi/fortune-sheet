const protectedSheet = {
  name: "protected",
  config: {
    authority: {
      sheet: 1,
    },
  },
  celldata: [
    { r: 0, c: 0, v: { v: "can edit", lo: 0 } },
    { r: 0, c: 1, v: { v: "is locked", lo: 1 } },
    { r: 0, c: 2, v: { v: "default is locked" } },
  ],
};

const editableSheet = {
  name: "editable",
  celldata: [
    { r: 0, c: 0, v: { v: "can edit", lo: 0 } },
    { r: 0, c: 1, v: { v: "is locked", lo: 1 } },
    { r: 0, c: 2, v: { v: "default can edit" } },
  ],
};
const lockcellData = [protectedSheet, editableSheet];

export default lockcellData;
