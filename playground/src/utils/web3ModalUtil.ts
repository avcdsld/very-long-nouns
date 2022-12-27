import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers, Contract } from "ethers";
import Web3Modal from "web3modal";
import { NounSeed } from "./assetsUtil";
import axios from 'axios';

const INFURA_ID = "9f5ace8940244ed9a769e493d783fda8";

export const switchNetwork = async (
    provider: providers.Web3Provider,
    targetChainId: string
) => {
    try {
        await provider.send("wallet_switchEthereumChain", [
            { chainId: targetChainId },
        ]);
    } catch (e: any) {
        // TODO:
        // // This error code indicates that the chain has not been added to MetaMask.
        // if (e.code === 4902) {
        //   try {
        //     // TODO: change
        //     await provider.send("wallet_addEthereumChain", [
        //       {
        //         chainId: "0x89",
        //         chainName: "Matic Network",
        //         nativeCurrency: {
        //           name: "Matic",
        //           symbol: "Matic",
        //           decimals: 18,
        //         },
        //         rpcUrls: ["https://rpc-mainnet.matic.network/"],
        //         blockExplorerUrls: ["https://polygonscan.com/"],
        //       },
        //     ]);
        //   } catch (addError) {
        //     throw addError;
        //   }
        // }
        alert("The network is incorrect");
    }
};

export const connect = async (): Promise<providers.Web3Provider> => {
    const web3Modal = new Web3Modal({
        // network: "goerli", // optional
        cacheProvider: false,
        providerOptions: {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    infuraId: INFURA_ID, // required
                },
            },
        },
    });
    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const network = await web3Provider.getNetwork();

    const targetChainId = 5; // Goerli
    if (network.chainId !== targetChainId) {
        await switchNetwork(web3Provider, "0x5");
        return await connect();
    }

    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();
    console.log({ address, network });

    return web3Provider;
};

export const originalNftContractAddress = "0x154fc3f3fe9BF6C70d6061E6998c0570b0619771"; // Goerli
export const originalNftContractAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function tokenOfOwnerByIndex(address,uint256) view returns (uint256)",
    "function tokenByIndex(uint256) view returns (uint256)",
    "function seeds(uint256) view returns ((uint48 background, uint48 body, uint48 accessory, uint48 head, uint48 glasses) seed)"
];

export const nftContractAddress = "0xacbd764FCd621592483196a7E61cCcb37e22043A"; // Goerli
export const nftContractAbi = [
    "function priceForNounOwner() view returns (uint256)",
    "function price() view returns (uint256)",
    "function mintForNounOwner(uint256) payable returns (uint256)",
    "function preMint(uint48,uint48,uint48,uint48,uint48,address,uint256,bytes) payable returns (uint256)",
    "function mint(uint48,uint48,uint48,uint48,uint48) payable returns (uint256)",
    "function isMintedSeed(uint48,uint48,uint48,uint48,uint48) view returns (bool)",
    "function exists(uint256) view returns (bool)",
    "function isPublicMintPaused() view returns (bool)",
];

export const checkExisting = async (
    nftContract: Contract,
    seed: { [key: string]: number },
): Promise<boolean> => {
    const isMinted = await nftContract.isMintedSeed(
        seed.background,
        seed.body,
        seed.accessory,
        seed.head,
        seed.glasses
    );
    console.log({ isMinted });
    if (isMinted) {
        alert(
            "This Noun has already been minted. Please use another combination."
        );
    }
    return isMinted;
}

export const mintForNounOwner = async (
    provider: providers.Web3Provider,
    tokenId: number,
) => {
    const nftContract = new Contract(
        nftContractAddress,
        nftContractAbi,
        provider.getSigner()
    );
    const exists = await nftContract.exists(tokenId);
    console.log({ exists });
    if (exists) {
        alert(
            "This Noun has already been minted. Please use another combination."
        );
        return;
    }

    const value = nftContract.priceForNounOwner();
    await nftContract.mintForNounOwner(tokenId, { value });
    alert(
        "Transaction has been sent. Please check your OpenSea account page after a while."
    );
}

export const mint = async (
    provider: providers.Web3Provider,
    seed: { [key: string]: number },
) => {
    const nftContract = new Contract(
        nftContractAddress,
        nftContractAbi,
        provider.getSigner()
    );

    const isPublicMintPaused = await nftContract.isPublicMintPaused();
    if (isPublicMintPaused) {
        alert(
            "Public Minting has not yet started. Look forward to it!"
        );
        return;
    }

    const existing = await checkExisting(nftContract, seed);
    if (existing) {
        return;
    }

    const value = nftContract.price();
    await nftContract.mint(
        seed.background,
        seed.body,
        seed.accessory,
        seed.head,
        seed.glasses,
        { value },
    );
    alert(
        "Transaction has been sent. Please check your OpenSea account page after a while."
    );
};

export const getPreMintSig = async (to: string): Promise<{ expiredAt: number, signature: string, allowed: boolean }> => {
    const apiUrl = `https://us-central1-very-long-nouns.cloudfunctions.net/api/signForPreMint?addr=${to.toLowerCase()}`;
    const res = await axios.get(apiUrl);
    return res.data;
}

export const preMint = async (
    provider: providers.Web3Provider,
    seed: { [key: string]: number },
) => {
    const nftContract = new Contract(
        nftContractAddress,
        nftContractAbi,
        provider.getSigner()
    );

    const existing = await checkExisting(nftContract, seed);
    if (existing) {
        return;
    }

    const to = await (provider.getSigner()).getAddress();
    const { expiredAt, signature, allowed } = await getPreMintSig(to);
    if (!allowed) {
        alert('Sorry, you are not eligible for Pre Minting.');
        return;
    }
    const value = nftContract.price();
    await nftContract.preMint(
        seed.background,
        seed.body,
        seed.accessory,
        seed.head,
        seed.glasses,
        to,
        expiredAt,
        signature,
        { value },
    );
    alert(
        "Transaction has been sent. Please check your OpenSea account page after a while."
    );
};

export const getOwnNounsSeedsInfo = async (
    provider: providers.Web3Provider,
): Promise<{ seed: NounSeed, tokenId: number }[] | []> => {
    const originalNftContract = new Contract(
        originalNftContractAddress,
        originalNftContractAbi,
        provider.getSigner()
    );

    const ownerAddress = provider.getSigner().getAddress();
    const balance = (await originalNftContract.balanceOf(ownerAddress)).toNumber();
    console.log({ balance });
    if (balance === 0) {
        alert("You do not own the original Noun.");
        return [];
    }

    const res = [];
    for (let i = 0; i < balance; i++) {
        const tokenId: number = (await originalNftContract.tokenOfOwnerByIndex(ownerAddress, i)).toNumber();
        const seed = await originalNftContract.seeds(tokenId);
        console.log({ tokenId, seed });
        res.push({
            seed: {
                background: Number(seed.background),
                body: Number(seed.body),
                accessory: Number(seed.accessory),
                head: Number(seed.head),
                glasses: Number(seed.glasses),
            },
            tokenId,
        })
    }
    return res;
};