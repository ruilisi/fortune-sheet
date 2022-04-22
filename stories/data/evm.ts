const data = {
  name: "EVM",
  status: 1,
  celldata: [
    { r: 0, c: 0, v: null },
    {
      r: 1,
      c: 1,
      v: {
        // ct: {
        //   fa: "General",
        //   t: "n",
        // },
        // bg: null,
        // bl: 0,
        // it: 0,
        // ff: 9,
        // fs: 10,
        // fc: "rgb(0, 0, 0)",
        // ht: 1,
        // vt: 0,
        v: "a207",
        m: "a207",
        // f: "=SUBTOTAL(9,OFFSET($D$15,ROW($D$15:$D$18)-ROW($D$15),1,3))",
      },
    },

    {
      r: 1,
      c: 2,
      v: {
        // ct: {
        //   fa: "General",
        //   t: "n",
        // },
        // bg: null,
        // bl: 0,
        // it: 0,
        // ff: 9,
        // fs: 10,
        // fc: "rgb(0, 0, 0)",
        // ht: 1,
        // vt: 0,
        v: "[\"(create a207 a207)\",\"a207a207f0\"]",
        //m: "a207",
        f: '=LIST("600b61000e600039600b6000f30061222260005260206000f3")',
      },
    },

    {
      r: 1,
      c: 3,
      v: {
        // ct: {
        //   fa: "General",
        //   t: "n",
        // },
        // bg: null,
        // bl: 0,
        // it: 0,
        // ff: 9,
        // fs: 10,
        // fc: "rgb(0, 0, 0)",
        // ht: 1,
        // vt: 0,
        // v: "[\"(create a207 a207)\",\"a207a207f0\"]",
        //m: "a207",
        f: "=CREATE(C2, C2)",
      },
    },
  
  ],
};

export default data;
