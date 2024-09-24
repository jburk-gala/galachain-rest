import {
  AllowanceType,
  CreateTokenClassDto,
  createValidDTO,
  FetchBalancesDto,
  FetchTokenClassesDto,
  GalaChainResponse,
  GrantAllowanceDto,
  MintTokenDto,
  TokenAllowance,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
} from '@gala-chain/api';
import { ChainClient, ContractConfig, gcclient } from '@gala-chain/client';
import { Inject, Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import * as path from 'path';
import { CredentialsService } from 'src/credentials/credentials.service';
import { plainToInstance } from 'class-transformer';
import { TOKEN_DATA } from 'src/nfts';
import { S3Service } from '../S3Service';
import { resolve } from 'path';
import { channel } from 'diagnostics_channel';

@Injectable()
export class TokenService {
  client: ChainClient;
  constructor(
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

    const contract: ContractConfig = {
      channel: 'product-channel',
      chaincode: 'basic-product',
      contract: 'GalaChainToken',
    };

    this.client = gcclient.forConnectionProfile(params).forContract(contract);
  }

  async getBalance(identityKey: string): Promise<GalaChainResponse<unknown>> {
    const dto = await createValidDTO<FetchBalancesDto>(FetchBalancesDto, {
      owner: identityKey,
    });

    //TODO sign this without admin later
    const data = await this.client.evaluateTransaction(
      'FetchBalances',
      dto.signed(this.credService.getAdminUser()),
    );
    return data;
  }

  async giveToken(
    tokenData: TOKEN_DATA,
    quantity: number,
    user: string,
  ): Promise<GalaChainResponse<unknown>> {
    const nftClassKey: TokenClassKey = toTokenClassKey(tokenData);
    const dto = await createValidDTO<MintTokenDto>(MintTokenDto, {
      owner: user,
      tokenClass: nftClassKey,
      quantity: new BigNumber(quantity),
    });

    const data = await this.client.submitTransaction(
      'MintToken',
      dto.signed(this.credService.getAdminUser()),
    );
    return data;
  }

  async setAllowance(tokenData: TOKEN_DATA) {
    const nftClassKey: TokenClassKey = toTokenClassKey(tokenData);
    const galaAllowanceDto = await createValidDTO<GrantAllowanceDto>(
      GrantAllowanceDto,
      {
        tokenInstance: TokenInstanceKey.nftKey(
          nftClassKey,
          TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
        ).toQueryKey(),
        allowanceType: AllowanceType.Mint,
        quantities: [
          {
            user: 'client|admin',
            quantity: new BigNumber(Number.MAX_SAFE_INTEGER),
          },
        ],
        uses: new BigNumber(Number.MAX_SAFE_INTEGER),
      },
    );

    const galaResult = await this.client.submitTransaction<TokenAllowance[]>(
      'GrantAllowance',
      galaAllowanceDto.signed(this.credService.getAdminUser()),
      TokenAllowance,
    );

    return galaResult;
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
        symbol: tokenData.name.slice(0, 20).replace(/\s/g, ''),
        description: tokenData.description,
        isNonFungible: true,
        image: s3Key,
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
