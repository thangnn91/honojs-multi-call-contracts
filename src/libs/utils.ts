import * as fs from 'fs';
const baseFileName = 'log.txt' as const;
export type MultiCallParams = {
    target: string;
    calldata: string;
};

export function mapCallContextToMatchContractFormat(
    calls: MultiCallParams[]
): Array<{
    target: string;
    callData: string;
}> {
    return calls.map((call) => {
        return {
            target: call.target,
            callData: call.calldata,
        };
    });
}

export const splitArray = function <T>(arr: T[], size: number) {
    let arr2 = arr.slice(0),
        arrays: T[][] = [];

    while (arr2.length > 0) {
        arrays.push(arr2.splice(0, size));
    }
    return arrays;
};

export const randomIntFromInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


export function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
