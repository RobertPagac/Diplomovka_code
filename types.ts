
export interface TextureGeneration {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

export enum ModelType {
  LOCAL_FLUX = 'local-flux'
}

export interface GenerationSettings {
  model: ModelType;
  seamless: boolean;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}
