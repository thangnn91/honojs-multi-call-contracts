import Credit from "@abis/TokenCredit.json";
import { CONTRACTS, RPCS } from "@libs/constants";
import { randomIntFromInterval, sleep, splitArray } from "@libs/utils";
import {
    ContractCallContext,
    ContractCallResults,
    Multicall
} from "ethereum-multicall";
import Web3 from "web3";
import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { calculateReward } from "./helpers";
const web3 = new Web3(RPCS.zkSync);
const limit = 60;
export async function processReward(addresses: string[], callback: () => void): Promise<any> {
    let responses: any[] = [];
    let errors: any[] = [];
    const stakerIndexParts = splitArray(addresses, limit);
    console.log("🚀 ~ file: routes.ts:286 ~ rewards.post ~ stakerIndexParts:", stakerIndexParts)
    for (const addresses of stakerIndexParts) {
        let params: any[] = [];
        for (const i of addresses) {
            const param = {
                reference: i,
                contractAddress: CONTRACTS.tokenCredit,
                abi: Credit.abi,
                calls: [
                    {
                        reference: "calculateRewardsEarned",
                        methodName: "calculateRewardsEarned",
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

        try {
            const results: ContractCallResults = await multicall.call(
                contractCallContext
            );

            const { result, error } = calculateReward(results);
            console.log("🚀 ~ file: routes.ts:336 ~ rewards.post ~ error:", error)
            console.log("🚀 ~ file: routes.ts:336 ~ rewards.post ~ result:", result)
            responses = responses.concat(result);
            errors = errors.concat(error);
            fs.appendFileSync(path.resolve(__dirname, 'responses.json'), JSON.stringify(result).slice(1, -1) + ',');
            if (error && errors.length) {
                fs.appendFileSync(path.resolve(__dirname, 'errors.json'), JSON.stringify(result).slice(1, -1) + ',');
            }
            await sleep(randomIntFromInterval(100, 300) * 10);
        } catch (error) {
            console.error("🚀 ~ file: worker.ts:80 ~ processReward ~ error:", error);
            fs.appendFileSync(path.resolve(__dirname, 'errors.json'), JSON.stringify(addresses).slice(1, -1) + ',');
        }

    }
    callback();
    return { responses, errors }

}
export const truncate = () => {
    fs.truncateSync(path.resolve(__dirname, 'responses.json'));
    fs.truncateSync(path.resolve(__dirname, 'errors.json'));
}

export const fetchExistedData = () => {
    const data = fs.readFileSync(path.resolve(__dirname, 'responses.json'));
    console.log('[' + data.toString().slice(0, -1) + ']')
    return JSON.parse('[' + data.toString().slice(0, -1) + ']')
}
// parentPort.postMessage(
//     processReward(workerData.value)
// );