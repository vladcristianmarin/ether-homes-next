interface PropertyAttribute {
  trait_type: string;
  value: string | number | string[];
}

export interface TokenizedProperty {
  name: string;
  description: string;
  image: string;
  attributes: PropertyAttribute[];
}

export interface SimplifiedTokenizedProperty {
  name: string;
  description: string;
  image: string;
  city: string;
  propertyaddress: string;
  rooms: number;
  bathrooms: number;
  usablearea: number;
  totalarea: number;
  yearofconstruction: number;
  documentsuris: string[];
  imagesuris: string[];
  price?: number;
}
