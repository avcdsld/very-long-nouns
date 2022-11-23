import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers, Contract } from "ethers";
import Web3Modal from "web3modal";
import { Button } from "react-bootstrap";
import classes from "./NounModal.module.css";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Noun from "../../../components/Noun";
import { svg2png } from "../../../utils/svg2png";
import { Backdrop } from "../../../components/Modal";

const INFURA_ID = "9f5ace8940244ed9a769e493d783fda8";

const downloadNounPNG = (png: string) => {
  const downloadEl = document.createElement("a");
  downloadEl.href = png;
  downloadEl.download = "noun.png";
  downloadEl.click();
};

const NounModal: React.FC<{
  onDismiss: () => void;
  svg: string;
  seed: { [key: string]: number };
}> = (props) => {
  const { onDismiss, svg, seed } = props;

  const [width, setWidth] = useState<number>(window.innerWidth);
  const [png, setPng] = useState<string | null>();

  const isMobile: boolean = width <= 991;

  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleWindowSizeChange);

    const loadPng = async () => {
      setPng(await svg2png(svg, 500, 500));
    };
    loadPng();

    return () => {
      window.removeEventListener("resize", handleWindowSizeChange);
    };
  }, [svg]);

  const switchNetwork = async (
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

  const connect = async (): Promise<providers.Web3Provider> => {
    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
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
    }
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();
    console.log({ address, network });

    return web3Provider;
  };

  const nftContractAddress = "0x154fc3f3fe9BF6C70d6061E6998c0570b0619771"; // Goerli
  const nftContractAbi = [
    "function mint(uint48,uint48,uint48,uint48,uint48) returns (uint256)",
    "function isMintedSeed(uint48,uint48,uint48,uint48,uint48) view returns (bool)",
  ];

  const mint = async (
    provider: providers.Web3Provider,
    seed: { [key: string]: number }
  ) => {
    const nftContract = new Contract(
      nftContractAddress,
      nftContractAbi,
      provider.getSigner()
    );

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
      return;
    }

    await nftContract.mint(
      seed.background,
      seed.body,
      seed.accessory,
      seed.head,
      seed.glasses
    );
    alert(
      "Transaction has been sent. Please check your OpenSea account page after a while."
    );
  };

  const mintNoun = async (seed: { [key: string]: number }) => {
    try {
      const web3Provider = await connect();
      // TODO: check seed existing
      await mint(web3Provider, seed);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      {ReactDOM.createPortal(
        <Backdrop
          onDismiss={() => {
            onDismiss();
          }}
        />,
        document.getElementById("backdrop-root")!
      )}
      {ReactDOM.createPortal(
        <div className={classes.modal}>
          {png && (
            <Noun
              imgPath={png}
              alt="noun"
              className={classes.nounImg}
              wrapperClassName={classes.nounWrapper}
            />
          )}
          <div className={classes.displayNounFooter}>
            <span>Use this Noun as your profile picture!</span>
            {!isMobile && png && (
              <Button
                onClick={() => {
                  downloadNounPNG(png);
                }}
              >
                Download
              </Button>
            )}
            {png && (
              <Button
                onClick={() => {
                  mintNoun(seed);
                }}
              >
                Mint
              </Button>
            )}
          </div>
        </div>,
        document.getElementById("overlay-root")!
      )}
    </>
  );
};
export default NounModal;
