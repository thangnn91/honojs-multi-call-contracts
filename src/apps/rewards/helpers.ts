import { ContractCallResults } from "ethereum-multicall";
import { CallsReturnContext } from "./types";

export const calclateReward = (data1: ContractCallResults, data2: ContractCallResults): { result: CallsReturnContext[], error: string[] } => {
    const { result, errors } = _calculateReward(data1);
    console.log("🚀 ~ file: helpers.ts:6 ~ calclateReward ~ result:", result)
    const { result: result2, errors: errors2 } = _calculateReward(data2);
    console.log("🚀 ~ file: helpers.ts:8 ~ calclateReward ~ result:", result2)
    const finalData = sumObjectsByKey(sumItem, result, result2);
    return { result: finalData as CallsReturnContext[], error: errors.concat(errors2) }
}

const _calculateReward = (data: ContractCallResults) => {
    let responseMultipleCall: CallsReturnContext[] = [];
    let errorData: string[] = [];
    const resultData = data?.results;
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
    return { result: responseMultipleCall, errors: errorData }
}

const sumObjectsByKey = (sumFn, ...arrs) => Array.from(
    arrs.flat() // combine the arrays
        .reduce((m, o) => // retuce the combined arrays to a Map
            m.set(o.address, // if add the item to the Map
                m.has(o.address) ? sumFn(m.get(o.address), o) : { ...o } // if the item exists in Map, sum the current item with the one in the Map. If not, add a clone of the current item to the Map
            )
            , new Map).values()
)

// utility function to sum to object values (without the id)
const sumItem = ({ address, ...a }, b) => ({
    address,
    ...Object.keys(a)
        .reduce((r, k) => ({ ...r, [k]: a[k] + b[k] }), {})
});