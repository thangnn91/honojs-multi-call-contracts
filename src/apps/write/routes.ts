import { Hono } from "hono";
import Web3 from "web3";
import { CONTRACTS, RPCS } from "@libs/constants";
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from "ethereum-multicall";
import Erc20Token from "@abis/ERC20.json";
import MultiCallAbi from "@abis/ERC20.json";
import { logger } from "@libs/logger";
import { RequestTransfer } from "./types";
import { mapCallContextToMatchContractFormat, MultiCallParams } from "@libs/utils";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
const web3 = new Web3(RPCS.zkSync);
const write = new Hono();

write.post("/transfer", async (c) => {
    const body = (await c.req.json()) as unknown as RequestTransfer;
    if (!body || !body.from || !body.to || body.from.length == 0 || body.from.length != body.to.length) {
        return c.json({ status: 401, message: "The request payload is required or invalid" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    // const executingInterface = new ethers.Interface(
    //     Erc20Token.abi
    // );
    // const contractAddress = "--------"; //erc20 token
    // let params: MultiCallParams[] = [];
    // for (let index = 0; index < body.from.length; index++) {
    //     [...params, {
    //         target: contractAddress,
    //         calldata: executingInterface.encodeFunctionData(
    //             'transferFrom',
    //             [body.from[index], body.to[index], parseEther("1")]
    //         )
    //     } as MultiCallParams]
    // }
    // const multicallContract = '--------------------';
    // const provider = ethers.getDefaultProvider(RPCS.zkSync);
    // const signer = new ethers.Wallet(process.env.PORT, provider);
    // const contractFactory = new ethers.Contract(
    //     multicallContract,
    //     MultiCallAbi.abi,
    //     signer
    // );

    // const tx = await contractFactory.tryAggregate(false, mapCallContextToMatchContractFormat(params));
    return c.json("Ok");
});

export default write;
