import { images, bgcolors } from './assetsImageData.json';

const { bodies, accessories, heads, glasses } = images;

export interface NounSeed {
    background: number;
    body: number;
    accessory: number;
    head: number;
    glasses: number;
}

export interface EncodedImage {
    filename: string;
    data: string;
}

export interface NounData {
    parts: EncodedImage[];
    background: string;
}

/**
 * Get encoded part and background information using a Noun seed
 * @param seed The Noun seed
 */
export const getNounData = (seed: NounSeed): NounData => {
    return {
        parts: [
            bodies[seed.body],
            accessories[seed.accessory],
            heads[seed.head],
            glasses[seed.glasses],
        ],
        background: bgcolors[seed.background],
    };
};

/**
 * Generate a random Noun seed
 * @param seed The Noun seed
 */
export const getRandomNounSeed = (): NounSeed => {
    return {
        background: Math.floor(Math.random() * bgcolors.length),
        body: Math.floor(Math.random() * bodies.length),
        accessory: Math.floor(Math.random() * accessories.length),
        head: Math.floor(Math.random() * heads.length),
        glasses: Math.floor(Math.random() * glasses.length),
    };
};

export { default as ImageData } from './assetsImageData.json';
