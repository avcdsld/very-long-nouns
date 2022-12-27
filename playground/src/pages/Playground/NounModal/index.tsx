import { Button } from "react-bootstrap";
import classes from "./NounModal.module.css";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Noun from "../../../components/Noun";
import { svg2png } from "../../../utils/svg2png";
import { Backdrop } from "../../../components/Modal";
import {
  connect,
  mint,
  preMint,
  mintForNounOwner,
} from "../../../utils/web3ModalUtil";

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
  tokenId: number;
}> = (props) => {
  const { onDismiss, svg, seed, tokenId } = props;

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

  const mintNoun = async (seed: { [key: string]: number }) => {
    try {
      const web3Provider = await connect();
      await mint(web3Provider, seed);
    } catch (e) {
      console.log(e);
    }
  };

  const preMintNoun = async (seed: { [key: string]: number }) => {
    try {
      const web3Provider = await connect();
      await preMint(web3Provider, seed);
    } catch (e) {
      console.log(e);
    }
  };

  const mintNounForNounOwner = async (tokenId: number) => {
    try {
      const web3Provider = await connect();
      await mintForNounOwner(web3Provider, tokenId);
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
            {png && tokenId >= 0 ? (
              <>
                <Button
                  onClick={() => {
                    mintNounForNounOwner(tokenId);
                  }}
                >
                  Mint for 0.005 ETH
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    preMintNoun(seed);
                  }}
                >
                  Pre Mint for 0.005 ETH
                </Button>
                <Button
                  onClick={() => {
                    mintNoun(seed);
                  }}
                >
                  Mint for 0.005 ETH
                </Button>
              </>
            )}
          </div>
        </div>,
        document.getElementById("overlay-root")!
      )}
    </>
  );
};
export default NounModal;
