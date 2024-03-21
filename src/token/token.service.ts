import {
  CreateTokenClassDto,
  createValidDTO,
  FetchTokenClassesDto,
  TokenClassKey,
} from '@gala-chain/api';
import { ChainClient, gcclient } from '@gala-chain/client';
import { Inject, Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import * as path from 'path';
import { CredentialsService } from 'src/credentials/credentials.service';
import { plainToInstance } from 'class-transformer';
import { TOKEN_DATA } from 'src/nfts';
import { S3Service } from '../S3Service';
import { resolve } from 'path';

@Injectable()
export class TokenService {
  client: ChainClient;
  constructor(
    // private configService: ConfigService,
    @Inject(S3Service) private s3service: S3Service,
    @Inject(CredentialsService) private credService: CredentialsService,
  ) {
    const params = {
      orgMsp: 'CuratorOrg',
      userId: 'admin',
      userSecret: 'adminpw',
      connectionProfilePath: path.resolve(
        'connection-profiles/cpp-curator.json',
      ),
    };

    const contract = {
      channelName: 'product-channel',
      chaincodeName: 'basic-product',
      contractName: 'GalaChainToken',
    };

    this.client = gcclient.forConnectionProfile(params).forContract(contract);
  }

  async createToken(tokenData: TOKEN_DATA) {
    let s3Key = `testing/${tokenData.collection}/${tokenData.name}_${tokenData.category}`;

    const useS3 = false;
    if (useS3) {
      const exists = await this.s3service.fileExists(
        s3Key,
        'tokens.gala.games',
      );
      if (!exists)
        await this.s3service.uploadFile(
          resolve(__dirname, `../assets/${tokenData.image}`),
          s3Key,
          'foo',
          // this.configService.get('BUCKET'),
        );
    } else {
      s3Key =
        'https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png';
    }

    const galaTokenDto: CreateTokenClassDto =
      await createValidDTO<CreateTokenClassDto>(CreateTokenClassDto, {
        decimals: 0,
        tokenClass: toTokenClassKey(tokenData),
        name: tokenData.name,
        symbol: tokenData.name.slice(0, 20).replace(' ', ''),
        description: tokenData.description,
        isNonFungible: true,
        image:  s3Key,
        maxSupply:
          tokenData.maxSupply != null
            ? BigNumber(tokenData.maxSupply)
            : BigNumber(Number.MAX_SAFE_INTEGER),
      });

    // When
    const response = await this.client.submitTransaction<TokenClassKey>(
      'CreateTokenClass',
      galaTokenDto.signed(this.credService.getAdminUser()),
      TokenClassKey,
    );

    return response;
  }
  

  async getTokenClasses(token_classes: TokenClassKey[]) {
    const findClassesDto: FetchTokenClassesDto =
      await createValidDTO<FetchTokenClassesDto>(FetchTokenClassesDto, {
        tokenClasses: token_classes,
      });

    const tokenData = (await this.client.evaluateTransaction(
      'FetchTokenClasses',
      findClassesDto.signed(this.credService.getAdminUser()),
    )) as any;

    return tokenData;
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
