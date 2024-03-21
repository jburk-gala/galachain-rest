import {
  ChainCallDTO,
  GalaChainResponse,
  GetMyProfileDto,
  RegisterEthUserDto,
  StringEnumProperty,
  UserProfile,
  createValidDTO,
} from '@gala-chain/api';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { execSync } from 'child_process';
import { ChainClient, gcclient } from '@gala-chain/client';
import * as path from 'path';
import { Variety } from './types';
import { ethers } from 'ethers';

interface CustomAPI {
  GetProfile(privateKey: string): Promise<UserProfile>;
  PlantTree(privateKey: string, index: number, variety: string): Promise<any>;
}

export class AppleTreeDto extends ChainCallDTO {
  @StringEnumProperty(Variety)
  public readonly variety: Variety;

  public readonly index: number;

  constructor(variety: Variety, index: number) {
    super();
    this.variety = variety;
    this.index = index;
  }
}

@Injectable()
export class AppService {
  client: ChainClient & CustomAPI;
  registerClient: ChainClient & CustomAPI;

  constructor() {
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
      contractName: 'AppleContract',
    };

    const publicKeyContract = {
      channelName: 'product-channel',
      chaincodeName: 'basic-product',
      contractName: 'PublicKeyContract',
    };

    this.client = gcclient
      .forConnectionProfile(params)
      .forContract(contract)
      .extendAPI(this.customAPI);

    this.registerClient = gcclient
      .forConnectionProfile(params)
      .forContract(publicKeyContract)
      .extendAPI(this.customAPI);
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

  public async plantTree(privateKey: string, index: number, variety: Variety) {
    return await this.client.PlantTree(privateKey, index, variety);
  }

  async registerUser(privateKey: string, publicKey: string) {
    const dto: RegisterEthUserDto = await createValidDTO<RegisterEthUserDto>(
      RegisterEthUserDto,
      {
        publicKey,
      },
    );
    return this.registerClient.submitTransaction(
      'RegisterEthUser',
      dto.signed(privateKey),
    );
  }

  customAPI(client: ChainClient): CustomAPI {
    return {
      async GetProfile(privateKey: string) {
        const dto = new GetMyProfileDto().signed(privateKey, false);
        const response = await client.evaluateTransaction(
          'GetMyProfile',
          dto,
          UserProfile,
        );
        if (GalaChainResponse.isError(response)) {
          throw new Error(
            `Cannot get profile: ${response.Message} (${response.ErrorKey})`,
          );
        } else {
          return response.Data as UserProfile;
        }
      },
      async PlantTree(privateKey: string, index: number, variety: Variety) {
        const dto = new AppleTreeDto(variety, index).signed(privateKey);
        const response = await client.submitTransaction('PlantTree', dto);
        if (GalaChainResponse.isError(response)) {
          return `Cannot get profile: ${response.Message} (${response.ErrorKey})`;
        } else {
          return response.Data;
        }
      },
    };
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

  private async dtoSign(filePath: string, payload: string): Promise<string> {
    const escapedPayload = payload.replace(/"/g, `"\"`);
    const command = `galachain dto-sign ${filePath} "${escapedPayload}"`;
    return await this.execCommand(command);
  }

  async enrollUser(): Promise<string> {
    const response = await axios.post('http://localhost:8801/user/enroll', {
      id: 'admin',
      secret: 'adminpw',
    });
    console.log('Enroll response:', response.data);
    return response.data.token;
  }

  async getMyProfile(token: string): Promise<any> {
    const dto = await this.dtoSign(
      'dev-admin-key/dev-admin.priv.hex.txt',
      '{}',
    );
    console.log('get_my_profile_dto:', dto);

    const payload = {
      method: 'PublicKeyContract:GetMyProfile',
      args: [dto],
    };

    const response = await axios.post(
      'http://localhost:8801/invoke/product-channel/basic-product',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('Profile response:', response.data);
    return response.data;
  }

}
