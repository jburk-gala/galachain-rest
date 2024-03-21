import { Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Variety } from './types';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('plant-tree/:index/:variety')
  async plantTree(
    @Param('index') index: number,
    @Param('variety') variety: Variety,
  ) {
    return this.appService.plantTree('todo', index, variety);
  }

  @Post('create-eth')
  async createUser() {
    return this.appService.generateEthereumWallet();
  }

  
  
  @Post('register-eth/:public')
  async registerUser(@Param('public') publicKey: string) {
    return this.appService.registerUser(this.getAdminUser(), publicKey);
  }

  @Post('test')
  async registerUser2(@Param('public') publicKey: string) {
    const randomWallet = ethers.Wallet.createRandom();
    const foo = await this.appService.registerUser(
      this.getAdminUser(),
      randomWallet.publicKey,
    );
    console.log(foo);
    const test = await this.appService.plantTree(
      randomWallet.privateKey,
      5,
      Variety.GOLDEN_DELICIOUS,
    );
    return test;
  }

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
