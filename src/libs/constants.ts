export const RPCS = {
  //zkSync: "https://zksync2-testnet.zksync.dev",
  zkSync: "https://mainnet.era.zksync.io"
};

export const CONTRACTS = {
  multiCall: "0x47898B2C52C957663aE9AB46922dCec150a2272c",//mainnet
  //multiCall: "0xba6248a1D7575c763C46fF595Df9C9543258Bbd7", //testnet
  nftReward: "0x1c927a23dd85fa1e0f50444c92cf76bdc8bbfaa8",
  referral: "0x51b7d02e5b308d9c648b3c6c800c9b996c171435",
  agency: "0x9E970fC1433351EB618D5822143492951384E310",
  tokenCredit: "0xacf75e6c016578255e22a2bb82896123e1c89a61",
  uGold: "0x9298437023e6246A60f2481c55bBc9cBB14F147d",
  staking: "0x7cF68AA037c67B6dae9814745345FFa9FC7075b1"
};
export const ETH_NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
export const welcomeHtml = `<style>
  body {
    margin: 0px;
  }
  .wrapper {
    height: 100vh;
    display: grid;
    place-items: center;
    background: black;
  }
  .txt {
    font-size: 68px;
    text-align: center;
    color: #fff;
    background: black;
    font-weight: bold;
    text-transform: uppercase;
    font-family: arial;
  }
  .txt::before {
    content: "Welcome to Hono 🔥🔥🔥!";
    position: absolute;
    mix-blend-mode: difference;
    filter: blur(3px);
  }
  .neon-wrapper {
    display: inline-grid;
    filter: brightness(200%);
    overflow: hidden;
  }
  .gradient {
    background: linear-gradient(
      117.73992253205643deg,
      rgba(231, 244, 245, 1) 7.05078125%,
      rgba(78, 240, 250, 1) 93.76953124999999%
    );
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    mix-blend-mode: multiply;
  }
  .dodge {
    background: radial-gradient(white, black 35%) center/25% 25%;
    position: absolute;
    top: -100%;
    left: -100%;
    right: 0px;
    bottom: 0px;
    mix-blend-mode: color-dodge;
    animation: dodge-area 3s linear infinite running;
  }
  @keyframes dodge-area {
    to {
      transform: translate(50%, 50%);
    }
  }
</style>
<div class="wrapper">
  <div class="neon-wrapper">
    <div class="txt">Welcome to Hono 🔥🔥🔥!</div>
    <span class="gradient"></span>
    <span class="dodge"></span>
  </div>
</div>
`;
export const LOG_PATH = "logs/";
