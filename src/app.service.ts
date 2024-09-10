import {
  ChainCallDTO,
  RegisterEthUserDto,
  createValidDTO,
} from '@gala-chain/api';
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { execSync } from 'child_process';
import { ChainClient, ContractConfig, gcclient } from '@gala-chain/client';
import * as path from 'path';
import { ethers } from 'ethers';

@Injectable()
export class AppService {
  clients: Record<string, ChainClient> = {};
  constructor() {
    const params = {
      orgMsp: 'CuratorOrg',
      userId: 'admin',
      userSecret: 'adminpw',
      connectionProfilePath: path.resolve(
        'connection-profiles/cpp-curator.json',
      ),
    };

    const contractConfigs: ContractConfig[] = [
      {
        channel: 'product-channel',
        chaincode: 'basic-product',
        contract: 'AppleContract',
      },
      {
        channel: 'product-channel',
        chaincode: 'basic-product',
        contract: 'GalaChainToken',
      },
      {
        channel: 'product-channel',
        chaincode: 'basic-product',
        contract: 'PublicKeyContract',
      },
    ];

    contractConfigs.forEach((contract) => {
      this.clients[contract.contract.toLowerCase()] = gcclient
        .forConnectionProfile(params)
        .forContract(contract);
    });
  }
  getHello(): string {
    return 'Hello World!';
  }

  generateEthereumWallet() {
    const randomWallet = ethers.Wallet.createRandom();

    console.log('Private Key:', randomWallet.privateKey);
    console.log('Public Key:', randomWallet.publicKey);
    return {
      privateKey: randomWallet.privateKey,
      publicKey: randomWallet.publicKey,
    };
  }

  public async postArbitrary(contract: string, method: string, body: any) {
    const contractConfg = this.clients[contract.toLowerCase()];

    if (!contractConfg)
      throw new NotFoundException(
        `Unable to find contract: ${contract} in the configuration`,
      );

    const testDto = await createValidDTO(ChainCallDTO, body);
    const response = await contractConfg.submitTransaction(method, testDto);
    if (response.ErrorCode) {
      throw new HttpException(
        response.Message || 'Galachain error',
        response.ErrorCode,
      );
    }
    return response;
  }

  async registerUser(privateKey: string, publicKey: string) {
    const dto: RegisterEthUserDto = await createValidDTO<RegisterEthUserDto>(
      RegisterEthUserDto,
      {
        publicKey,
      },
    );
    return this.clients['publickeycontract'].submitTransaction(
      'RegisterEthUser',
      dto.signed(privateKey),
    );
  }

  private async execCommand(command: string): Promise<string> {
    try {
      const output = execSync(command, { encoding: 'utf-8' }); // the output will be a String
      return output;
    } catch (error) {
      console.error(`Error executing command: ${command}`, error);
      throw error;
    }
  }
}
