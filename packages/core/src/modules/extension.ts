import {ethers} from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

// MetaMask requires requesting permission to connect users accounts
provider.send("eth_requestAccounts", []);

const signer = provider.getSigner();

const contracts = [];
const defines = [];

const interpret_addrs = "0x0000000000000000000000000000000000000019";
const interpret_abi = [
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "bytecode",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "input",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "gas",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "analyze",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "pc",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "reads",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "writes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "calls",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "memsize",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "gasUsed",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "output",
				"type": "bytes"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "bytecodeFragment",
				"type": "bytes"
			},
			{
				"internalType": "bytes32[]",
				"name": "stack",
				"type": "bytes32[]"
			},
			{
				"internalType": "uint256",
				"name": "gas",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "analyzeFrag",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "pc",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "reads",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "writes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "calls",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "memsize",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "gasUsed",
				"type": "uint256"
			},
			{
				"internalType": "bytes32[]",
				"name": "stackOutput",
				"type": "bytes32[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "bytecode",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "input",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "gas",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "interpret",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "result",
				"type": "bytes"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "readHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "writeHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "bytecode",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "input",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "gas",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "part",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "newReadHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "newWriteHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "output",
				"type": "bytes"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "readHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "writeHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "bytecodeFragment",
				"type": "bytes"
			},
			{
				"internalType": "bytes32[]",
				"name": "stack",
				"type": "bytes32[]"
			},
			{
				"internalType": "uint256",
				"name": "gas",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "partFrag",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "newReadHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "newWriteHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32[]",
				"name": "stackOutput",
				"type": "bytes32[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const ops = {
  "LIST": "",
  "ADD": "01",
  "MUL": "02",
  "SUB": "03",
  "DIV": "04",
  "SDIV": "05",
  "MOD": "06",
  "SMOD": "07",
  "EXP": "0a",
  "SIGNEXTEND": "0b",
  "LT": "10",
  "GT": "11",
  "SLT": "12",
  "SGT": "13",
  "EQ": "14",
  "AND": "16",
  "OR": "17",
  "XOR": "18",
  "BYTE": "1a",
  "SHL": "1b",
  "SHR": "1c",
  "SAR": "1d",
  "SHA3": "20",
  "MSTORE": "52",
  "MSTORE8": "53",
  "SSTORE": "55",
  "JUMPI": "57",
  "LOG0": "a0",
  "RETURN": "f3",
  "REVERT": "fd",
  "ADDMOD": "08",
  "MULMOD": "09",
  "CALLDATACOPY": "37",
  "CODECOPY": "39",
  "EXTCODECOPY": "3c",
  "RETURNDATACOPY": "3e",
  "LOG1": "a1",
  "CREATE": "f0",
  "LOG2": "a2",
  "CREATE2": "f5",
  "LOG3": "a3",
  "LOG4": "a4",
  "DELEGATECALL": "f4",
  "STATICCALL": "fa",
  "CALL": "f1",
  "CALLCODE": "f2"
}

const loco = function(c,r){
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[c]+(r+2);
}

const fargs = function(opcode, code){
  return function(){
    // if (arguments.length < this.m[0] || arguments.length > this.m[1]) {
    //   return formula.error.na;
    // }
    let arg0,arg01,temp, ans=["("+opcode, code];
    console.log("FUNC_SIG",arguments);
    let args = [...arguments];

    args = args.map(dirornot);
    for (let i in arguments){
      temp = resolve(arguments[i]);
      ans = [ans[0]+" "+temp[0], temp[1]+ans[1]];
      console.log(opcode,temp,ans);
    }
    ans = JSON.stringify([ans[0]+")", ans[1]]);
    console.log(opcode,ans);
    return ans;
  }
}

const farg2 = function(inp){
  let ans = ["("+inp[0], ops[inp[0]]];
  let temp = null;
  for (let i in inp){
    //temp = resolve(arguments[i]);
    temp = inp[i];
    ans = [ans[0]+" "+temp[0], temp[1]+ans[1]];
    console.log(temp,ans);
  }
  return JSON.stringify(ans);
};

const farg3 = function(opcode){
  return function(){
    // if (arguments.length < this.m[0] || arguments.length > this.m[1]) {
    //   return formula.error.na;
    // }
    let arg0,arg01,temp, ans=["("+opcode.toLowerCase(), ops[opcode]];
    console.log("FUNC_SIG",arguments);
    let args = [...arguments];

    //args = args.map(dirornot);
    for (let i in args){
      // temp = resolve(arguments[i]);
      try {
        temp = JSON.parse(arguments[i])
        console.log("temp-json",temp)
        ans = [ans[0]+" "+temp[0].join(" "), temp[1].join("")+ans[1]];
      } catch {
        temp = arguments[i];
        console.log("temp2",temp)
        ans = [ans[0]+" "+temp.join(" "), temp.join("")+ans[1]];
      }
      
      
      console.log(opcode,temp,ans);
    }
    ans = JSON.stringify([ans[0]+")", ans[1]]);
    console.log(opcode,ans);
    return ans;
  }
}

function json(text){
  return text;
}

const select = function(inp){
  let  part1 = JSON.parse(inp[0]);
  let  part2 = JSON.parse(inp[1]);
  return JSON.stringify(part1[part2]);
}

const eth_call = function(inp){
  let contract = contracts[inp[0]] || null;
  if (!contract) {
    console.log("args", inp);
    // console.log(new ethers.Contract());
    contract = new ethers.Contract(inp[0], interpret_abi, signer); // inp[1]
    contracts[inp[0]] = contract;
    console.log("ccc", contract);
  }
  let arg3 = inp[2];
  let ans = contract.functions[arg3](...(inp.slice(3)));
  ans.then((data) => {
    console.log("daaata", data);
  });
  return "Loading...";
};

const eth_tx = function(inp){
  let contract = contracts[inp[0]] || null;
  if (!contract) {
    console.log("args", inp);
    // console.log(new ethers.Contract());
    contract = new ethers.Contract(inp[0], interpret_abi, signer); // inp[1]
    contracts[inp[0]] = contract;
    console.log("ccc", contract);
  }
  let arg3 = inp[2];
  let ans = contract.functions[arg3](...(inp.slice(3)));
  ans.then(receipt=> receipt.wait()).then(data => {
    flowData[cellRow][cellColumn] = {
      "v": "(eth-tx ...)",
      "f": cellFunction
    }; 
    
    flowData[cellRow+1][cellColumn] = {
      "v": JSON.stringify(data)
    }; 
    jfrefreshgrid(flowData, [{"row": [cellRow, cellRow], "column": [cellColumn, cellColumn]}]);
  });
  return "Loading...";
};


function etherst(inp) {
  console.log("ethers", ethers, provider);
  return JSON.stringify([inp[0], 4]);
}

export function extendParser(parser: any) {
  parser.setFunction("ETH", etherst);
  parser.setFunction("SEL", select);
  parser.setFunction("ETH_CALL", eth_call);
  parser.setFunction("ETH_TX", eth_tx);
  // parser.setFunction("STOP", fargs("stop", "00"));
  // parser.setFunction("CREATE", farg3("CREATE"));
  for (let i in ops){
    parser.setFunction(i, farg3(i));
    console.log(i,ops[i]);
  }
  return parser;
}
