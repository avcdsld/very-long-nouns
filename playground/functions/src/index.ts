import * as functions from "firebase-functions";
import * as express from "express";
const { ethers } = require("ethers");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

const app: express.Express = express();
const cors = require("cors")({ origin: true });
const router: express.Router = express.Router();
app.use(router);

// TODO: Update & care of lower case
const AllowList = ['0x73dab14e15d6539c27baa205cc0a7fa5bc5a378b'];

const isAllowedAddress = (addr: string): boolean => {
    return AllowList.includes(addr.toLowerCase());
}

const sign = async (addr: string) => {
    const expiredAt = Math.floor(new Date().getTime() / 1000) + 300; // until 5 min later
    const payload = ethers.utils.solidityPack(["address", "uint256"], [addr, expiredAt]);
    const hash = ethers.utils.keccak256(payload);
    const signature = await wallet.signMessage(ethers.utils.arrayify(hash));
    return { expiredAt, signature, allowed: true };
}

router.get("/signForPreMint", (req, res) => {
    cors(req, res, () => {
        const addr = String(req.query.addr);
        if (!isAllowedAddress(addr)) {
            functions.logger.info("not allowed address: " + addr, { structuredData: true });
            res.set("Access-Control-Allow-Origin", "*");
            res.json({ expiredAt: "", signature: "", allowed: false });
        } else {
            functions.logger.info("allowed address: " + addr, { structuredData: true });
            sign(addr).then(result => {
                functions.logger.info("allowed address: " + addr + ", result: " + JSON.stringify(result), { structuredData: true });
                res.set("Access-Control-Allow-Origin", "*");
                res.json(result);
            })
        }
    });
});

export const api = functions.https.onRequest(app);
