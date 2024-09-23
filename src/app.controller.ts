import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Variety } from './types';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { PublicKeyApi, ServerSigningClient } from '@gala-chain/connect';
import { GalaChainResponse, UserProfileBody } from '@gala-chain/api';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('server-side/test')
  async serverSignTest(): Promise<GalaChainResponse<unknown>> {
    const randomWallet = ethers.Wallet.createRandom();
    const registration = await this.appService.registerUser(
      this.getAdminUser(),
      randomWallet.publicKey,
    );
    const serverSigningClient = new ServerSigningClient(
      randomWallet.privateKey,
    );

    const dto = await serverSigningClient.sign('PublicKeyContract', {}); //Empty because we just need the signature
    return this.appService.postArbitrary(
      'PublicKeyContract',
      'GetMyProfile',
      dto,
    );
  }

  @Post('registerself/:publicKey')
  async register(@Param('publicKey') publicKey: string) {
    const registration = await this.appService.registerUser(
      this.getAdminUser(),
      publicKey,
    );
    return registration;
  }

  @Post('asset/:contract/:method')
  async testMethod(
    @Param('contract') contract: string,
    @Param('method') method: string,
    @Body() body: any,
  ): Promise<GalaChainResponse<unknown>> {
    console.log(`Method: ${method}`);
    console.log(`Body: ${JSON.stringify(body)}`);
    return await this.appService.postArbitrary(contract, method, body);
  }

  @Post('create-eth')
  async createUser() {
    return this.appService.generateEthereumWallet();
  }

  @Post('register/new-random')
  async registerNewRandom(): Promise<{
    registration: GalaChainResponse<unknown>;
    publicKey: string;
    privateKey: string;
  }> {
    const randomWallet = ethers.Wallet.createRandom();
    const registration = await this.appService.registerUser(
      this.getAdminUser(),
      randomWallet.publicKey,
    );

    return {
      registration,
      publicKey: randomWallet.publicKey,
      privateKey: randomWallet.privateKey,
    };
  }

  @Post('register-eth/:public')
  async registerUser(
    @Param('public') publicKey: string,
  ): Promise<GalaChainResponse<unknown>> {
    return this.appService.registerUser(this.getAdminUser(), publicKey);
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
