export interface TOKEN_DATA {
  decimals: number;
  collection: string;
  description: string;
  category: string;
  name: string;
  isNonFungible: boolean;
  image: string;
  rarity: string;
  maxSupply?: number;
}

export const NFT_DATA = [
  {
    decimals: 0,
    collection: 'TestCollection2',
    description: 'A pretty nifty item',
    category: 'Mahoodle',
    name: 'Super Sword',
    isNonFungible: false,
    image: 'todo',
  },
  {
    decimals: 0,
    collection: 'TestCollection2',
    description: 'A pretty nifty item',
    category: 'Mahoodle',
    name: 'Super Sword Two',
    isNonFungible: false,
    image: 'todo',
  },
  {
    decimals: 0,
    collection: 'TestCollection2',
    description: 'A pretty nifty item',
    category: 'Mahoodle',
    name: 'Super Sword Three',
    isNonFungible: false,
    image: 'todo',
  },
] as TOKEN_DATA[];
