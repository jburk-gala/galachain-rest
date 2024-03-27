import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { ConfigService } from './config.service';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    if (!process.env.AWS_SECRETS_ID) {
      const s3_access_key = this.configService.get('s3_access_key');
      const s3_secret = this.configService.get('s3_access_secret');
      if (!s3_access_key || !s3_secret)
        throw `Must have S3_ACCESS_KEY and S3_ACCESS_SECRET in .env`;
      this.s3 = new S3Client({
        region: 'us-east-1',
        credentials: { accessKeyId: s3_access_key, secretAccessKey: s3_secret },
      });
    } else {
      this.s3 = new S3Client({});
    }
  }

  async fileExists(fileKey: string, bucket: string) {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });
    try {
      await this.s3.send(command);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound') {
        return false;
      }
      throw err;
    }
  }

  async uploadFile(filePath: string, fileKey: string, bucket: string) {
    const fileStream = createReadStream(filePath);
    const params = {
      Bucket: bucket,
      Key: fileKey,
      Body: fileStream,
    };

    const uploadCommand = new PutObjectCommand(params);
    return await this.s3.send(uploadCommand);
  }

  async getFile(key: string, bucket: string): Promise<Readable> {
    const params = {
      Bucket: bucket,
      Key: key,
    };
    const command = new GetObjectCommand(params);
    const response = await this.s3.send(command);
    const test = response.Body as Readable;
    if (test instanceof Readable) {
      return test;
    } else {
      throw new NotFoundException(
        `Unable to find file in bucket: ${bucket} with key: ${key}`,
      );
    }
  }
}
