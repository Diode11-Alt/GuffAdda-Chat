import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

export class MediaService {
  static get uploadsDir() {
    return path.join(__dirname, '../../uploads');
  }

  static init() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  static async saveFile(fileStream: any, filename: string, mimetype: string): Promise<{ id: string, url: string, size: number, type: string }> {
    this.init();
    
    // Generate a unique ID for the file
    const ext = path.extname(filename) || '';
    const id = crypto.randomBytes(16).toString('hex') + ext;
    
    const filePath = path.join(this.uploadsDir, id);
    const writeStream = fs.createWriteStream(filePath);
    
    let size = 0;
    fileStream.on('data', (chunk: Buffer) => {
      size += chunk.length;
    });

    await pipeline(fileStream, writeStream);

    return {
      id,
      url: `/uploads/${id}`,
      size,
      type: mimetype
    };
  }
}
