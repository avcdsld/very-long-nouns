import {
  Container,
  Col,
  Button,
  Row,
  FloatingLabel,
  Form,
} from "react-bootstrap";
import classes from "./Playground.module.css";
import React, { ReactNode, useEffect, useState } from "react";
// import { ImageData, getNounData, getRandomNounSeed } from "@nouns/assets";
import {
  ImageData,
  getNounData,
  getRandomNounSeed,
} from "../../utils/assetsUtil";
import { buildSVG, PNGCollectionEncoder } from "@nouns/sdk";
import Noun from "../../components/Noun";
import NounModal from "./NounModal";

interface Trait {
  title: string;
  traitNames: string[];
}

interface PendingCustomTrait {
  type: string;
  data: string;
  filename: string;
}

const encoder = new PNGCollectionEncoder(ImageData.palette);

const parseTraitName = (partName: string): string =>
  capitalizeFirstLetter(partName.substring(partName.indexOf("-") + 1));

const capitalizeFirstLetter = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const traitKeyToLocalizedTraitKeyFirstLetterCapitalized = (
  s: string
): ReactNode => {
  const traitMap = new Map([
    ["background", "Background"],
    ["body", "Body"],
    ["accessory", "Accessory"],
    ["head", "Head"],
    ["glasses", "Glasses"],
  ]);

  return traitMap.get(s);
};

const Playground: React.FC = () => {
  const [nounSvgs, setNounSvgs] = useState<string[]>();
  const [nounSeeds, setNounSeeds] = useState<{ [key: string]: number }[]>();
  const [traits, setTraits] = useState<Trait[]>();
  const [modSeed, setModSeed] = useState<{ [key: string]: number }>();
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [displayNoun, setDisplayNoun] = useState<boolean>(false);
  const [indexOfNounToDisplay, setIndexOfNounToDisplay] = useState<number>();
  const [selectIndexes, setSelectIndexes] = useState<Record<string, number>>(
    {}
  );
  const [pendingTrait] = useState<PendingCustomTrait>();

  const generateNounSvg = React.useCallback(
    (amount: number = 1) => {
      for (let i = 0; i < amount; i++) {
        const seed = { ...getRandomNounSeed(), ...modSeed };
        const { parts, background } = getNounData(seed);
        let svg = buildSVG(parts, encoder.data.palette, background);
        svg = svg.replaceAll(
          `width="320" height="320`,
          `width="640" height="640`
        );
        svg = svg.replaceAll(`viewBox="0 0 320 320"`, `viewBox="0 0 640 640"`);
        setNounSvgs((prev) => {
          return prev ? [svg, ...prev] : [svg];
        });
        setNounSeeds((prev) => {
          return prev ? [seed, ...prev] : [seed];
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingTrait, modSeed]
  );

  useEffect(() => {
    const traitTitles = ["background", "body", "accessory", "head", "glasses"];
    const traitNames = [
      ["cool", "warm"],
      ...Object.values(ImageData.images).map((i) => {
        return i.map((imageData) => imageData.filename);
      }),
    ];
    setTraits(
      traitTitles.map((value, index) => {
        return {
          title: value,
          traitNames: traitNames[index],
        };
      })
    );

    if (initLoad) {
      generateNounSvg(8);
      setInitLoad(false);
    }
  }, [generateNounSvg, initLoad]);

  const traitOptions = (trait: Trait) => {
    return Array.from(Array(trait.traitNames.length + 1)).map((_, index) => {
      const traitName = trait.traitNames[index - 1];
      const parsedTitle = index === 0 ? `Random` : parseTraitName(traitName);
      return (
        <option key={index} value={traitName}>
          {parsedTitle}
        </option>
      );
    });
  };

  const traitButtonHandler = (trait: Trait, traitIndex: number) => {
    setModSeed((prev) => {
      // -1 traitIndex = random
      if (traitIndex < 0) {
        let state = { ...prev };
        delete state[trait.title];
        return state;
      }
      return {
        ...prev,
        [trait.title]: traitIndex,
      };
    });
  };

  return (
    <>
      {displayNoun &&
        indexOfNounToDisplay !== undefined &&
        nounSvgs &&
        nounSeeds && (
          <NounModal
            onDismiss={() => {
              setDisplayNoun(false);
            }}
            svg={nounSvgs[indexOfNounToDisplay]}
            seed={nounSeeds[indexOfNounToDisplay]}
          />
        )}

      <Container fluid="lg">
        <Row>
          <Col lg={10} className={classes.headerRow}>
            <span>VeryLongNouns</span>
            <h1>Playground</h1>
          </Col>
        </Row>
        <Row>
          <Col lg={3}>
            <Col lg={12}>
              <Button
                onClick={() => {
                  generateNounSvg();
                }}
                className={classes.primaryBtn}
              >
                Generate Nouns
              </Button>
            </Col>
            <Row>
              {traits &&
                traits.map((trait, index) => {
                  return (
                    <Col lg={12} xs={6} key={index}>
                      <Form className={classes.traitForm}>
                        <FloatingLabel
                          controlId="floatingSelect"
                          label={traitKeyToLocalizedTraitKeyFirstLetterCapitalized(
                            trait.title
                          )}
                          key={index}
                          className={classes.floatingLabel}
                        >
                          <Form.Select
                            aria-label="Floating label select example"
                            className={classes.traitFormBtn}
                            value={
                              trait.traitNames[selectIndexes?.[trait.title]] ??
                              -1
                            }
                            onChange={(e) => {
                              let index = e.currentTarget.selectedIndex;
                              traitButtonHandler(trait, index - 1); // - 1 to account for 'random'
                              setSelectIndexes({
                                ...selectIndexes,
                                [trait.title]: index - 1,
                              });
                            }}
                          >
                            {traitOptions(trait)}
                          </Form.Select>
                        </FloatingLabel>
                      </Form>
                    </Col>
                  );
                })}
            </Row>
          </Col>
          <Col lg={9}>
            <Row>
              {nounSvgs &&
                nounSvgs.map((svg, i) => {
                  return (
                    <Col xs={6} lg={4} key={i}>
                      <div
                        onClick={() => {
                          setIndexOfNounToDisplay(i);
                          setDisplayNoun(true);
                        }}
                      >
                        <Noun
                          imgPath={`data:image/svg+xml;base64,${btoa(svg)}`}
                          alt="noun"
                          className={classes.nounImg}
                          wrapperClassName={classes.nounWrapper}
                        />
                      </div>
                    </Col>
                  );
                })}
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};
export default Playground;
