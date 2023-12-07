import { Hono } from "hono";
import Web3 from "web3";
import { CONTRACTS, ETH_NATIVE_ADDRESS, RPCS } from "@libs/constants";
import {
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import Erc20Token from "@abis/ERC20.json";
import { CallsReturnContext, RequestTokens } from "./types";
import { logger } from "@libs/logger";
import { ethers } from "ethers";
const web3 = new Web3(RPCS.zkSync);
const balances = new Hono();

balances.post("/multiple-tokens", async (c) => {
  const body = (await c.req.json()) as unknown as RequestTokens;
  if (!body || !body.tokens || !body.owner || body.tokens.length === 0) {
    return c.json({ status: 401, message: "The request payload is required" });
  }
  logger.info(`request: ${JSON.stringify(body)}`);
  const tokens = body.tokens;
  let params: any[] = [];
  for (const i of tokens) {
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
    multicallCustomContractAddress: CONTRACTS.multiCall,
  });
  const contractCallContext: ContractCallContext[] = params;

  const results: ContractCallResults = await multicall.call(
    contractCallContext
  );

  let responseMultipleCall: CallsReturnContext[] = [];
  const resultData = results?.results;
  if (resultData) {
    const balanceInWei = await web3.eth.getBalance(body.owner);
    responseMultipleCall = [...responseMultipleCall, {
      token: ETH_NATIVE_ADDRESS,
      decoded: false,
      returnValues: [{
        type: "BigNumber",
        hex: `0x${Number(balanceInWei).toString(16)}`
      }],
      success: true
    }];
    for (const key in resultData) {
      const data = { token: key, ...resultData[key].callsReturnContext[0] } as CallsReturnContext;
      responseMultipleCall = [...responseMultipleCall, data];
    }
  }
  else {
    logger.warn("empty resultData");
  }
  logger.info(`request: ${JSON.stringify(responseMultipleCall)}`);
  return c.json(responseMultipleCall);
});

export default balances;
