import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor(filePath: string) {
    //todo, swap this
    // this.envConfig = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = {
      s3_access_key: 'test',
      s3_access_secret: 'foo',
    };
  }

  get(key: string): string {
    if (this.envConfig[key] == undefined) {
      throw new Error(`Unable to find key: ${key} in envConfig!`);
    }
    return this.envConfig[key];
  }
}
