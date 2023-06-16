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