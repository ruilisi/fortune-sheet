import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

// MetaMask requires requesting permission to connect users accounts
provider.send("eth_requestAccounts", []);

const signer = provider.getSigner();

const contracts = [];
// const defines = [];

const interpret_addrs = "0x0000000000000000000000000000000000000019";
const interpret_abi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "bytecode",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "input",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "gas",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "analyze",
    outputs: [
      {
        internalType: "uint256",
        name: "pc",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reads",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "writes",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "calls",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "memsize",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gasUsed",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "output",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "bytecodeFragment",
        type: "bytes",
      },
      {
        internalType: "bytes32[]",
        name: "stack",
        type: "bytes32[]",
      },
      {
        internalType: "uint256",
        name: "gas",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "analyzeFrag",
    outputs: [
      {
        internalType: "uint256",
        name: "pc",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reads",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "writes",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "calls",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "memsize",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gasUsed",
        type: "uint256",
      },
      {
        internalType: "bytes32[]",
        name: "stackOutput",
        type: "bytes32[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "bytecode",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "input",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "gas",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "interpret",
    outputs: [
      {
        internalType: "bytes",
        name: "result",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "readHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "writeHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "bytecode",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "input",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "gas",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "part",
    outputs: [
      {
        internalType: "bytes32",
        name: "newReadHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "newWriteHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "output",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "readHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "writeHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "bytecodeFragment",
        type: "bytes",
      },
      {
        internalType: "bytes32[]",
        name: "stack",
        type: "bytes32[]",
      },
      {
        internalType: "uint256",
        name: "gas",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "partFrag",
    outputs: [
      {
        internalType: "bytes32",
        name: "newReadHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "newWriteHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32[]",
        name: "stackOutput",
        type: "bytes32[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const post_ops = {
  LIST: "",
  STOP: "00",
  ADD: "01",
  MUL: "02",
  SUB: "03",
  DIV: "04",
  SDIV: "05",
  MOD: "06",
  SMOD: "07",
  EXP: "0a",
  SIGNEXTEND: "0b",
  LT: "10",
  GT: "11",
  SLT: "12",
  SGT: "13",
  EQ: "14",
  AND: "16",
  OR: "17",
  XOR: "18",
  BYTE: "1a",
  SHL: "1b",
  SHR: "1c",
  SAR: "1d",
  SHA3: "20",
  MSTORE: "52",
  MSTORE8: "53",
  SSTORE: "55",
  JUMPI: "57",
  LOG0: "a0",
  RETURN: "f3",
  REVERT: "fd",
  ADDMOD: "08",
  MULMOD: "09",
  CALLDATACOPY: "37",
  CODECOPY: "39",
  EXTCODECOPY: "3c",
  RETURNDATACOPY: "3e",
  LOG1: "a1",
  CREATE: "f0",
  LOG2: "a2",
  CREATE2: "f5",
  LOG3: "a3",
  LOG4: "a4",
  DELEGATECALL: "f4",
  STATICCALL: "fa",
  CALL: "f1",
  CALLCODE: "f2",
  "ADDRESS": "30",
  "ORIGIN": "32",
  "CALLER": "33",
  "CALLVALUE": "34",
  "CALLDATASIZE":  "36",
  "CODESIZE": "38",
  "GASPRICE": "3a",
  "RETURNDATASIZE":  "3d",
  "COINBASE": "41",
  "TIMESTAMP":  "42",
  "NUMBER": "43",
  "DIFFICULTY": "44",
  "GASLIMIT":  "45",
  "CHAINID": "46",
  "SELFBALANCE":  "47",
  "BASEFEE": "48",
  "POP": "50",
  "PC": "58",
  "MSIZE":  "59",
  "GAS": "5a",
  "JUMPDEST": "5b",
  "INVALID":  "fe",
  
  "ISZERO": "15",
  "NOT": "19",
  "BALANCE": "31",
  "CALLDATALOAD": "35",
  "EXTCODESIZE": "3b",
  "EXTCODEHASH": "3f",
  "BLOCKHASH": "40",
  "MLOAD": "51",
  "SLOAD": "54",
  "JUMP": "56",
  "SELFDESTRUCT": "ff",
};

const ante_ops = {
  DEPLOYER: "600261000e60003960026000f3",
};

const loco = function (c, r) {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[c] + (r + 2);
};

const pushx = function () {
  let args = arguments[0];
  let len = args[1]? args[1] : (args[0].length/2);
  let content = args[0].padStart(len*2, "0");
  let ans = ["(push "+len+" 0x"+content+")", (95+len).toString(16)+content];
  console.log("PUSH",args,len);
  return JSON.stringify(ans);

};

const dupx = function () {
  let args = arguments[0];
  let arg0 = args[0]? args[0] : 1;
  let ans = ["(dup"+arg0+")", (127+arg0).toString(16)]
  return ans;
};

const swapx = function () {
  let args = arguments[0];
  let arg0 = args[0]? args[0] : 1;
  let ans = ["(swap"+arg0+")", (143+arg0).toString(16)];
  return ans;
};


const post = function (opcode) {
  return function (...args) {
    // if (arguments.length < this.m[0] || arguments.length > this.m[1]) {
    //   return formula.error.na;
    // }
    console.log("FUNC_SIG", opcode, args);
    let arg0;
    let arg01;
    let temp;
    let ans = [`(${opcode.toLowerCase()}`, post_ops[opcode]];
    

    // args = args.map(dirornot);
    // for (const i in args) {
    for (let i = 0; i < args.length; i++) {
      // temp = resolve(arguments[i]);
      console.log("arg", i, args[i]);
      try {
        temp = JSON.parse(args[i]);
        console.log("temp-json", temp);
        ans = [`${ans[0]} ${temp[0].join(" ")}`, temp[1].join("") + ans[1]];
      } catch {
        temp = args[i];
        console.log("temp2", temp);
        ans = [`${ans[0]} ${temp.join(" ")}`, temp.join("") + ans[1]];
      }

      console.log(opcode, temp, ans);
    }
    ans = JSON.stringify([`${ans[0]})`, ans[1]]);
    console.log(opcode, ans);
    return ans;
  };
};

const def = function (parser) {
  return function () {
    console.log("def", arguments);
    const ins = arguments.values;
    console.log("def0", inp, ins);
    const ans = ["", ""];
    ins.map((input) => {
      ans[1] += input;
    });
    post_ops[ins[0]] = ans[1];
    extendParser(parser);
    return `${ins[0]}: ${ans[1]}`;
  };
};

const ante = function (opcode) {
  return function (...args) {
    // if (arguments.length < this.m[0] || arguments.length > this.m[1]) {
    //   return formula.error.na;
    // }
    let arg0;
    let arg01;
    let temp;
    console.log("FUNC_SIG", opcode, args);
    let ans = [`(${opcode.toLowerCase()}`, ante_ops[opcode]];
    

    // args = args.map(dirornot);
    for (let i = 0; i < args.length; i++) {
      // temp = resolve(arguments[i]);
      try {
        temp = JSON.parse(args[i]);
        console.log("temp-json", temp);
        ans = [`${ans[0]} ${temp[0].join(" ")}`, temp[1].join("") + ans[1]];
      } catch {
        temp = args[i];
        console.log("temp2", temp);
        ans = [`${ans[0]} ${temp.join(" ")}`, temp.join("") + ans[1]];
      }

      console.log(opcode, temp, ans);
    }
    ans = JSON.stringify([`${ans[0]})`, ans[1]]);
    console.log(opcode, ans);
    return ans;
  };
};

const select = function (inp) {
  const part1 = JSON.parse(inp[0]);
  const part2 = JSON.parse(inp[1]);
  return JSON.stringify(part1[part2]);
};

const eth_call = function (inp) {
  let contract = contracts[inp[0]] || null;
  if (!contract) {
    console.log("args", inp);
    // console.log(new ethers.Contract());
    contract = new ethers.Contract(inp[0], inp[1], signer); // inp[1]
    contracts[inp[0]] = contract;
    console.log("ccc", contract);
  }
  const arg3 = inp[2];
  const ans = contract.functions[arg3](...inp.slice(3));
  ans.then((data) => {
    console.log("daaata", data);
  });
  return "Loading...";
};

function prefix_0x(text: string) {
  if (text.slice(0, 2) === "0x") return text;
  return `0x${text}`;
}

const interpret = function (inp) {
  let contract = contracts[interpret_addrs] || null;
  if (!contract) {
    console.log("args", inp);
    // console.log(new ethers.Contract());
    contract = new ethers.Contract(interpret_addrs, interpret_abi, signer); // inp[1]
    contracts[interpret_addrs] = contract;
    console.log("interpret", contract);
  }
  const arg3 = JSON.parse(inp[0]);
  console.log(arg3, inp);
  console.log("aaaa", _);
  const ans = contract.functions.interpret(
    prefix_0x(arg3[1]),
    prefix_0x(inp[1]),
    inp[2],
    inp[3]
  );

  ans.then((data) => {
    console.log("daaata", data);

  });
  return ans;
};

const inter = function (cod) {
  return function () {
    let contract = contracts[interpret_addrs] || null;
    let inp = arguments;
    if (!contract) {
      console.log("args", inp);
      // console.log(new ethers.Contract());
      contract = new ethers.Contract(interpret_addrs, interpret_abi, signer); // inp[1]
      contracts[interpret_addrs] = contract;
      console.log("interpret", contract);
    }
    const arg3 = JSON.parse(inp[0]);
    console.log(arg3, inp);
    console.log("aaaa", _);
    const ans = contract.functions[cod](
      prefix_0x(arg3[1]),
      prefix_0x(inp[1]),
      inp[2],
      inp[3]
    );

    ans.then((data) => {
      console.log("daaata", data);

    });
    return ans;
  };
};


const eth_tx = function (inp) {
  let contract = contracts[inp[0]] || null;
  if (!contract) {
    console.log("args", inp);
    // console.log(new ethers.Contract());
    contract = new ethers.Contract(inp[0], interpret_abi, signer); // inp[1]
    contracts[inp[0]] = contract;
    console.log("ccc", contract);
  }
  const arg3 = inp[2];
  const ans = contract.functions[arg3](...inp.slice(3));
  ans
    .then((receipt) => receipt.wait())
    .then((data) => {
      flowData[cellRow][cellColumn] = {
        v: "(eth-tx ...)",
        f: cellFunction,
      };

      flowData[cellRow + 1][cellColumn] = {
        v: JSON.stringify(data),
      };
      jfrefreshgrid(flowData, [
        { row: [cellRow, cellRow], column: [cellColumn, cellColumn] },
      ]);
    });
  return "Loading...";
};

function etherst(inp) {
  console.log("ethers", ethers, provider);
  return JSON.stringify([inp[0], 4]);
}

function hex2a(inp) {
  console.log("hex2a",inp)
  var hex = inp[0].toString()
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function a2hex(inp) {
  console.log("a2hex",inp)
  var arg0 = inp[0].toString()
  var arr = [];
  for (var i = 0, l = arg0.length; i < l; i ++) {
    var hex = Number(arg0.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join('');
}


export function extendParser(parser: any) {
  parser.setFunction("ETH", etherst);
  parser.setFunction("SEL", select);

  parser.setFunction("INTERPRET", inter("interpret"));
  parser.setFunction("ANALYZE", inter("analyze"));
  parser.setFunction("ANAFRAG", inter("analyzeFrag"));
  parser.setFunction("PART", inter("part"));
  parser.setFunction("PARTFRAG", inter("partFrag"));
  //parser.setFunction("INTERPRET", inter("interpret"));

  parser.setFunction("ETH_CALL", eth_call);
  parser.setFunction("ETH_TX", eth_tx);
  //parser.setFunction("DEF", def(parser));
  // parser.setFunction("STOP", fargs("stop", "00"));
  // parser.setFunction("CREATE", farg3("CREATE"));
  for (const i in post_ops) {
    parser.setFunction(i, post(i));
    console.log(i, post_ops[i]);
  }
  parser.setFunction("PUSH", pushx);
  parser.setFunction("DUP", dupx);
  parser.setFunction("SWAP", swapx);
  parser.setFunction("HEX2A", hex2a);
  parser.setFunction("A2HEX", a2hex);
  for (const i in ante_ops) {
    parser.setFunction(i, ante(i));
    console.log(i, ante_ops[i]);
  }
  console.log(parser);
  return parser;
}
