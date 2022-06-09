import { PNGCollectionEncoder, PngImage } from './image';
import { PNG } from 'pngjs';
import { promises as fs } from 'fs';
import path from 'path';

const DESTINATION = path.join(__dirname, './output/image-data.json');

const readPngImage = async (path: string): Promise<PngImage> => {
    const buffer = await fs.readFile(path);
    const png = PNG.sync.read(buffer);

    return {
        width: png.width,
        height: png.height,
        rgbaAt: (x: number, y: number) => {
            const idx = (png.width * y + x) << 2;
            const [r, g, b, a] = [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
            return {
                r,
                g,
                b,
                a,
            };
        },
    };
};

const encode = async () => {
    const encoder = new PNGCollectionEncoder();

    const folders = ['bodies', 'accessories', 'heads', 'glasses'];
    for (const folder of folders) {
        const folderpath = path.join(__dirname, './input', folder);
        const files = await fs.readdir(folderpath);
        for (const file of files) {
            const image = await readPngImage(path.join(folderpath, file));
            encoder.encodeImage(file.replace(/\.png$/, ''), image, folder);
        }
    }
    await encoder.writeToFile(DESTINATION);
};

encode();
