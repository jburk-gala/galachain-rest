import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CredentialsService {
  getAdminUser() {
    const privateKey =
      process.env.TEST_ADMIN_PRIVATE_KEY ??
      fs
        .readFileSync(
          path.resolve('dev-admin-key/dev-admin.priv.hex.txt'),
          'utf-8',
        )
        .toString();

    return privateKey;
  }
}
