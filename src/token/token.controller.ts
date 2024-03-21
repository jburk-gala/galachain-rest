import {
  CreateTokenClassDto,
  TokenClassKey,
  createValidDTO,
} from '@gala-chain/api';
import { Controller, Inject, Post } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { CredentialsService } from 'src/credentials/credentials.service';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(@Inject(TokenService) private tokenService: TokenService) {}
  @Post('mint')
  async mintToken() {
    // return this.tokenService.createToken('test', 'test2', 'test3');
  }
}
