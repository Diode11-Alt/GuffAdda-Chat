"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("stream/promises");
const crypto_1 = __importDefault(require("crypto"));
class MediaService {
    static get uploadsDir() {
        return path_1.default.join(__dirname, '../../uploads');
    }
    static init() {
        if (!fs_1.default.existsSync(this.uploadsDir)) {
            fs_1.default.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }
    static async saveFile(fileStream, filename, mimetype) {
        this.init();
        // Generate a unique ID for the file
        const ext = path_1.default.extname(filename) || '';
        const id = crypto_1.default.randomBytes(16).toString('hex') + ext;
        const filePath = path_1.default.join(this.uploadsDir, id);
        const writeStream = fs_1.default.createWriteStream(filePath);
        let size = 0;
        fileStream.on('data', (chunk) => {
            size += chunk.length;
        });
        await (0, promises_1.pipeline)(fileStream, writeStream);
        return {
            id,
            url: `/uploads/${id}`,
            size,
            type: mimetype
        };
    }
}
exports.MediaService = MediaService;
