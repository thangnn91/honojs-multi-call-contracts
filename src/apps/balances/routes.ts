import { Hono } from "hono";
import Web3 from "web3";
import { contracts, rpc } from "../../constants";
import {
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import Erc20Token from "../../abis/ERC20.json";
import { RequestTokens } from "./types";
const web3 = new Web3(rpc.zkSync);
const balances = new Hono();

balances.post("/multiple-tokens", async (c) => {
  const body = (await c.req.json()) as unknown as RequestTokens;
  console.log(body);
  if (!body || !body.tokens || !body.owner || body.tokens.length === 0) {
    return c.json({ status: 401, message: "The request payload is required" });
  }
  const tokens = body.tokens;
  let params: any[] = [];
  let count = 0;
  for (const i of tokens) {
    count++;
    const param = {
      reference: i,
      contractAddress: i,
      abi: Erc20Token.abi,
      calls: [
        {
          reference: "balanceOf",
          methodName: "balanceOf",
          methodParameters: [body.owner],
        },
      ],
    };
    params.push(param);
  }
  const multicall = new Multicall({
    web3Instance: web3,
    tryAggregate: true,
    multicallCustomContractAddress: contracts.multipleCall,
  });
  const contractCallContext: ContractCallContext[] = params;

  const results: ContractCallResults = await multicall.call(
    contractCallContext
  );
  return c.json({ content: results });
});

export default balances;
