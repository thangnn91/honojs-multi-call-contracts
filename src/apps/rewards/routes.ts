import { Hono } from "hono";
import { validator } from 'hono/validator';
import Web3 from "web3";
import { contracts, rpc } from "@libs/constants";
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from "ethereum-multicall";
import NftReward from "@abis/NftRewardAbi.json";
import Referral from "@abis/Referral.json";
import Agency from "@abis/Agency.json";
import Credit from "@abis/TokenCredit.json";
import Snapshot from "../../datas/snapshot67.json";
import { logger } from "@libs/logger";
import { CallsReturnContext, RequestBotAddresses } from "./types";
import { userRewardValidation } from "./validation";
const web3 = new Web3(rpc.zkSync);
const rewards = new Hono();
const ROUND_LENGTH = 50;
rewards.post("/v1/nft-rewards", async (c) => {
    const body = (await c.req.json()) as unknown as RequestBotAddresses;
    if (!body || !body.bots || !body.bots.length) {
        return c.json({ status: 401, message: "The request payload is required" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    const bots = body.bots;
    const fromRound = body.fromRound ?? 1;
    const toRound = body.toRound ?? ROUND_LENGTH;

    let params: any[] = [];
    for (let j = fromRound; j < toRound; j++) {
        const param = {
            reference: `roundtokens_${j}`,
            contractAddress: contracts.nftReward,
            abi: NftReward.abi,
            calls: [
                {
                    reference: "roundTokens",
                    methodName: "roundTokens",
                    methodParameters: [j],
                },
            ],
        };
        params.push(param);
    }
    for (const i of bots) {
        for (let j = fromRound; j < toRound; j++) {
            const param = {
                reference: `roundorders_${i}_${j}`,
                contractAddress: contracts.nftReward,
                abi: NftReward.abi,
                calls: [
                    {
                        reference: "roundOrdersToClaim",
                        methodName: "roundOrdersToClaim",
                        methodParameters: [i, j],
                    },
                ],
            };
            params.push(param);
        }
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

    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;
    if (resultData) {
        const set = new Set();
        for (const key in resultData) {
            if (key.startsWith('roundorders')) {
                const keyPath = key.split('_');
                if (!resultData[key].callsReturnContext[0].success || !resultData[`roundtokens_${keyPath[2]}`].callsReturnContext[0].success) {
                    errorData.push(key);
                    continue;
                }
                const roundTokens = Number(resultData[`roundtokens_${keyPath[2]}`].callsReturnContext[0].returnValues[0].hex)
                if (!set.has(keyPath[1])) {

                    let callObject: CallsReturnContext = { address: keyPath[1], pendingReward: (Number(resultData[key].callsReturnContext[0].returnValues[0].hex)) * roundTokens / ROUND_LENGTH };
                    set.add(keyPath[1]);
                    responseMultipleCall.push(callObject);
                }
                else {
                    let callObject = responseMultipleCall.find(o => o.address === keyPath[1])
                    callObject.pendingReward += (Number(resultData[key].callsReturnContext[0].returnValues[0].hex)) * roundTokens / ROUND_LENGTH;
                }
            }
        }
    }
    else {
        logger.warn("empty resultData");
    }
    return c.json({ responseMultipleCall, errorData });
});

rewards.post("/standard-rewards", validator('json', (value, c) => {
    const parsed = userRewardValidation.safeParse(value);
    if (!parsed.success) {
        return c.text('Invalid!', 401)
    }
    return parsed.data
}), async (c) => {
    const { addresses } = c.req.valid('json')
    let params: any[] = [];
    for (const i of addresses) {
        const param = {
            reference: i,
            contractAddress: contracts.referral,
            abi: Referral.abi,
            calls: [
                {
                    reference: "referrerDetails",
                    methodName: "referrerDetails",
                    methodParameters: [i],
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
    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;
    if (resultData) {
        for (const key in resultData) {
            if (resultData[key].callsReturnContext[0].success) {
                responseMultipleCall.push({
                    address: key,
                    pendingReward: Number(resultData[key].callsReturnContext[0].returnValues[2].hex)
                });
            }
            else {
                errorData.push(key);
            }

        }
    }
    return c.json({ responseMultipleCall, errorData });
})

rewards.post("/agency-rewards", validator('json', (value, c) => {
    const parsed = userRewardValidation.safeParse(value);
    if (!parsed.success) {
        return c.text('Invalid!', 401)
    }
    return parsed.data
}), async (c) => {
    const { addresses } = c.req.valid('json')
    let params: any[] = [];
    for (const i of addresses) {
        const param = {
            reference: i,
            contractAddress: contracts.agency,
            abi: Agency.abi,
            calls: [
                {
                    reference: "reward",
                    methodName: "reward",
                    methodParameters: [i],
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
    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;
    if (resultData) {
        for (const key in resultData) {
            if (resultData[key].callsReturnContext[0].success) {
                responseMultipleCall.push({
                    address: key,
                    pendingReward: Number(resultData[key].callsReturnContext[0].returnValues[0].hex)
                });
            }
            else {
                errorData.push(key);
            }

        }
    }
    return c.json({ responseMultipleCall, errorData });
})

rewards.post("/nft-rewards", async (c) => {
    const body = (await c.req.json()) as unknown as RequestBotAddresses;
    if (!body || !body.bots || !body.bots.length) {
        return c.json({ status: 401, message: "The request payload is required" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    const bots = body.bots;
    let params: any[] = [];
    for (const i of bots) {
        const param = {
            reference: i,
            contractAddress: contracts.nftReward,
            abi: NftReward.abi,
            calls: [
                {
                    reference: "tokensToClaim",
                    methodName: "tokensToClaim",
                    methodParameters: [i],
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

    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;

    if (resultData) {
        for (const key in resultData) {
            if (resultData[key].callsReturnContext[0].success) {
                responseMultipleCall.push({
                    address: key,
                    pendingReward: Number(resultData[key].callsReturnContext[0].returnValues[0].hex)
                });
            }
            else {
                errorData.push(key);
            }

        }
    }
    else {
        logger.warn("empty resultData");
    }
    return c.json({ responseMultipleCall, errorData });
});


rewards.post("/snapshot", async (c) => {
    const body = (await c.req.json()) as unknown as RequestBotAddresses;
    if (!body || !body.bots || !body.bots.length) {
        return c.json({ status: 401, message: "The request payload is required" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    const bots = body.bots;
    let params: any[] = [];
    for (const i of Snapshot) {
        const param = {
            reference: i.address,
            contractAddress: contracts.tokenCredit,
            abi: Credit.abi,
            calls: [
                {
                    reference: "contributeOfUserAtEpoch",
                    methodName: "contributeOfUserAtEpoch",
                    methodParameters: [7, i.address],
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

    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;

    if (resultData) {
        for (const key in resultData) {
            if (resultData[key].callsReturnContext[0].success) {
                responseMultipleCall.push({
                    address: key,
                    pendingReward: Number(resultData[key].callsReturnContext[0].returnValues[2].hex)
                });
            }
            else {
                errorData.push(key);
            }

        }
    }
    else {
        logger.warn("empty resultData");
    }
    return c.json({ responseMultipleCall, errorData });
});


export default rewards;
