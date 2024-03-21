import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { TokenService } from './token.service';
import { NFT_DATA } from 'src/nfts';

@Controller('token')
export class TokenController {
  constructor(@Inject(TokenService) private tokenService: TokenService) {}
  @Post('give/:itemnum/:user')
  async mintToken(
    @Param('user') user: string,
    @Param('itemnum') itemnum: number,
  ) {
    return this.tokenService.giveToken(NFT_DATA[itemnum], 1, user);
  }

  @Get(':user')
  async getAmounts(@Param('user') user: string) {
    return this.tokenService.getBalance(user);
  }
}
