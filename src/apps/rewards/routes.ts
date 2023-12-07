import { Hono } from "hono";
import { validator } from 'hono/validator';
import Web3 from "web3";
import { CONTRACTS, RPCS } from "@libs/constants";
import { splitArray, randomIntFromInterval, sleep } from "@libs/utils";
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from "ethereum-multicall";
import NftReward from "@abis/NftRewardAbi.json";
import Referral from "@abis/Referral.json";
import Agency from "@abis/Agency.json";
import Credit from "@abis/TokenCredit.json";
import Staking from "@abis/Staking.json";
import { logger } from "@libs/logger";
import { CallsReturnContext, RequestBotAddresses, StakingReturnContext } from "./types";
import { listAddressValidation as userRewardValidation } from "@libs/validation";
import { calculateReward } from "./helpers";
import { Worker } from 'worker_threads';
import * as path from 'path';
import { fetchExistedData, processReward, truncate } from "./workerxx";
import { ethers, Wallet } from "ethers";
import Erc20 from '@abis/ERC20.json';

let requesting = false;
const web3 = new Web3(RPCS.zkSync);
const rewards = new Hono();
const ROUND_LENGTH = 50;
rewards.post("/v1/nft-rewards", async (c) => {
    const body = (await c.req.json()) as unknown as RequestBotAddresses;
    if (!body || !body.bots || !body.bots.length) {
        return c.json({ status: 400, message: "The request payload is required" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    const bots = body.bots;
    const fromRound = body.fromRound ?? 1;
    const toRound = body.toRound ?? ROUND_LENGTH;

    let params: any[] = [];
    for (let j = fromRound; j < toRound; j++) {
        const param = {
            reference: `roundtokens_${j}`,
            contractAddress: CONTRACTS.nftReward,
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
                contractAddress: CONTRACTS.nftReward,
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
        multicallCustomContractAddress: CONTRACTS.multiCall,
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
                    callObject.pendingReward = +callObject.pendingReward + (Number(resultData[key].callsReturnContext[0].returnValues[0].hex)) * roundTokens / ROUND_LENGTH;
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
        return c.text('Invalid request payload!', 400)
    }
    return parsed.data
}), async (c) => {
    const { addresses } = c.req.valid('json');

    let params: any[] = [];
    for (const i of addresses) {
        const param = {
            reference: i,
            contractAddress: CONTRACTS.referral,
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
        multicallCustomContractAddress: CONTRACTS.multiCall,
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
        return c.text('Invalid request payload!', 400)
    }
    return parsed.data
}), async (c) => {
    const { addresses } = c.req.valid('json')
    let params: any[] = [];
    for (const i of addresses) {
        const param = {
            reference: i,
            contractAddress: CONTRACTS.agency,
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
        multicallCustomContractAddress: CONTRACTS.multiCall,
    });
    const contractCallContext: ContractCallContext[] = params;

    const results: ContractCallResults = await multicall.call(
        contractCallContext
    );
    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;

    return c.json({ responseMultipleCall, errorData });
})

rewards.post("/nft-rewards", async (c) => {
    const body = (await c.req.json()) as unknown as RequestBotAddresses;
    if (!body || !body.bots || !body.bots.length) {
        return c.json({ status: 400, message: "The request payload is required" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    const bots = body.bots;
    let params: any[] = [];
    for (const i of bots) {
        const param = {
            reference: i,
            contractAddress: CONTRACTS.nftReward,
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
        multicallCustomContractAddress: CONTRACTS.multiCall,
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

rewards.post("/token-credit-rewards", validator('json', (value, c) => {
    if (requesting) {
        return c.text('Processing!! Please wait', 400);
    }
    const parsed = userRewardValidation.safeParse(value);
    if (!parsed.success) {
        return c.text('Invalid!', 400);
    }
    return parsed.data
}), async (c) => {
    const { addresses } = c.req.valid('json');
    console.log("🚀 ~ file: routes.ts:287 ~ rewards.post ~ addresses:", addresses);
    requesting = true;
    truncate();
    processReward(addresses, () => {
        console.log("==============Finished processing==============");
        requesting = false;
    });
    return c.json('Accepted. Please wait!!');
})

rewards.get("/token-credit-rewards/data", async (c) => {
    return c.json(fetchExistedData());
})

rewards.post("/user-earn", async (c) => {
    const allAddresses = (await c.req.json()) as unknown as string[];
    const stakerIndexParts = splitArray(allAddresses, 400);
    let response: any[] = [];
    for (const addresses of stakerIndexParts) {
        let params: any[] = [];
        for (const i of addresses) {
            const param = {
                reference: i,
                contractAddress: CONTRACTS.tokenCredit,
                abi: Credit.abi,
                calls: [
                    {
                        reference: "userEarn",
                        methodName: "userEarn",
                        methodParameters: [i],
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
        const { result, error } = calculateReward(results);
        response.push(result)
    }


    return c.json({ response });
});

rewards.post("/multicall-mint-ugold", async (c) => {
    const provider = new ethers.providers.JsonRpcProvider(RPCS.zkSync);
    const wallet = new Wallet("-------------------------------------------", provider);
    const allAddresses = (await c.req.json()) as unknown as string[];
    const taker = splitArray(allAddresses, 400);
    let response: any[] = [];
    for (const addresses of taker) {
        let params: any[] = [];
        for (const i of addresses) {
            const param = {
                reference: i,
                contractAddress: CONTRACTS.uGold,
                abi: Erc20.abi,
                calls: [
                    {
                        reference: "mint",
                        methodName: "mint",
                        methodParameters: [i, 200000000],
                    },
                ],
            };
            params.push(param);
        }
        const multicall = new Multicall({
            ethersProvider: wallet.provider,
            tryAggregate: true,
            multicallCustomContractAddress: CONTRACTS.multiCall,
        });
        console.log("🚀 ~ file: routes.ts:373 ~ rewards.post ~ multicall:", multicall)
        const contractCallContext: ContractCallContext[] = params;
        const results: ContractCallResults = await multicall.call(
            contractCallContext
        );
        response.push(results)
    }
    return c.json({ response });
});

rewards.post("/staking-rewards", validator('json', (value, c) => {
    const parsed = userRewardValidation.safeParse(value);
    if (!parsed.success) {
        return c.text('Invalid payload request!', 400)
    }
    return parsed.data
}), async (c) => {
    const { addresses } = c.req.valid('json');

    let params: any[] = [];
    for (const i of addresses) {
        const stakingRewardParam = {
            reference: i,
            contractAddress: CONTRACTS.staking,
            abi: Staking.abi,
            calls: [
                {
                    reference: "pendingRewardUsdc",
                    methodName: "pendingRewardUsdc",
                    methodParameters: [i],
                },
                {
                    reference: "users",
                    methodName: "users",
                    methodParameters: [i],
                },
            ],
        };
        params.push(stakingRewardParam);
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
    let responseMultipleCall: StakingReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = results?.results;
    if (resultData) {
        for (const key in resultData) {
            if (resultData[key].callsReturnContext[0].success && resultData[key].callsReturnContext[1].success) {
                responseMultipleCall.push({
                    address: key,
                    pendingReward: resultData[key].callsReturnContext[0].returnValues[0].hex?.toString(),
                    havestedReward: resultData[key].callsReturnContext[1].returnValues[2].hex?.toString(),
                });
            }
            else {
                errorData.push(key);
            }

        }
    }
    return c.json({ responseMultipleCall, errorData });
})

rewards.post("/snapshot", async (c) => {
    throw new Error("Not implemented");
    const body = (await c.req.json()) as unknown as RequestBotAddresses;
    if (!body || !body.bots || !body.bots.length) {
        return c.json({ status: 401, message: "The request payload is required" });
    }
    logger.info(`request: ${JSON.stringify(body)}`);
    const bots = body.bots;
    let params: any[] = [];
    for (const i of []) {
        const param = {
            reference: i.address,
            contractAddress: CONTRACTS.tokenCredit,
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
        multicallCustomContractAddress: CONTRACTS.multiCall,
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
