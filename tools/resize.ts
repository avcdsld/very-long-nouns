import { readPngFile, rect, xy, colorRGB } from "node-libpng";
import { PathLike, promises as fs } from 'fs';
import * as path from 'path';

async function dirExists(filePath: PathLike) {
    try {
        return (await fs.lstat(filePath)).isDirectory();
    } catch (e) {
        return false;
    }
}

const resize = async () => {
    const folders = ['bodies', 'accessories', 'heads', 'glasses'];
    for (const folder of folders) {
        const folderPath = path.join(__dirname, './images', folder);
        const files = await fs.readdir(folderPath);

        const outputFolderPath = path.join('./resized', folder);
        if (!(await dirExists(outputFolderPath))) {
            await fs.mkdir(outputFolderPath, { recursive: true });
        }

        for (const file of files) {
            console.log(`New dimensions: ${file}.`);

            const image = await readPngFile(path.join(folderPath, file));
            image.resizeCanvas({
                offset: xy(16, 16),
                // clip: rect(0, 0, 72, 72),
                dimensions: xy(32 * 2, 32 * 2),
                // fillColor: colorRGB(255, 0, 0),
            });
            image.write(path.join(outputFolderPath, file));
            console.log(`New dimensions: ${image.width}x${image.height}.`);
        }
    }
};

resize();
