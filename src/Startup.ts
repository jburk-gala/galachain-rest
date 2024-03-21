import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { S3Service } from './S3Service';
import { FISH_DATA, TOKEN_DATA } from './nfts';
import { TokenClassKey } from '@gala-chain/api';
import { plainToInstance } from 'class-transformer';
import { resolve } from 'path';
import { TokenService } from './token/token.service';
import { CredentialsService } from './credentials/credentials.service';
import { ConfigService } from './config.service';

@Injectable()
export class Startup implements OnModuleInit {
  // Inject other services through the constructor if needed
  constructor(
    @Inject(S3Service) private s3service: S3Service,
    @Inject(TokenService) private tokenService: TokenService,
    @Inject(CredentialsService) private credsService: CredentialsService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  //TODO: fix this so it doesn't remint everything if a single token is missing
  async onModuleInit() {
    console.log('Running startup script...');

    const token_classes = FISH_DATA.map((fish) => {
      const nftClassKey: TokenClassKey = toTokenClassKey(fish);
      return nftClassKey;
    });

    const tokenData = await this.tokenService.getTokenClasses(token_classes);
    if (tokenData.Data) {
      console.log(`Found: ${tokenData.Data.length} created tokens`);
    }

    if (!tokenData) throw `Unable to get data`;

    const promises = FISH_DATA.map(async (nft) => {
      if (tokenData.Data) {
        const found = tokenData.Data.find(
          (token) =>
            token.collection === nft.collection &&
            token.type === nft.name &&
            token.category === nft.category &&
            token.name === nft.name,
        );
        if (found) return;
      }
      const useS3 = false;
      if (useS3) {
        const s3Key = `testing/${nft.collection}/${nft.name}_${nft.category}`;

        const exists = await this.s3service.fileExists(
          s3Key,
          this.configService.get('s3_secret'),
        );
        if (!exists)
          await this.s3service.uploadFile(
            resolve(__dirname, `../assets/${nft.image}`),
            s3Key,
            this.configService.get('s3_bucket'),
          );
      }

      const data = await this.tokenService.createToken(nft);
      console.log(JSON.stringify(data));
    });

    await Promise.all(promises);
  }
}

export function toTokenClassKey(
  { collection, category, rarity, name }: TOKEN_DATA,
  additionalKeySuffix?: string,
): TokenClassKey {
  const type = name.replace(/\([^)]*\)/g, '').trim();
  return plainToInstance(TokenClassKey, {
    collection: collection,
    category: category,
    additionalKey: rarity + (additionalKeySuffix || ''),
    type: type,
  });
}
