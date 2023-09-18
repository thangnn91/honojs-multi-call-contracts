export type RequestTokens = {
  owner: string;
  tokens: string[];
};


export interface ResponseMultipleCall {
  callsReturnContext: CallsReturnContext[]
}

export interface CallsReturnContext {
  returnValues: unknown
  decoded: boolean
  reference?: string
  methodName?: string
  token: string
  success: boolean
}