export type RequestBotAddresses = {
    fromRound: number;
    toRound: number;
    bots: string[];
};

export interface CallsReturnContext {
    address: string
    pendingReward: number
}