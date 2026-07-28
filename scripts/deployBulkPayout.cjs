const { ethers } = require('ethers');
const fs = require('fs');
const solc = require('solc');
require('dotenv').config();

const source = fs.readFileSync('contracts/BulkPayout.sol', 'utf8');

const input = {
  language: 'Solidity',
  sources: { 'BulkPayout.sol': { content: source } },
  settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const contract = output.contracts['BulkPayout.sol']['BulkPayout'];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const factory = new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, wallet);
  const deployed = await factory.deploy({ gasLimit: 3000000 });
  await deployed.waitForDeployment();
  console.log('BulkPayout deployed to:', await deployed.getAddress());
}

main().catch(console.error);
