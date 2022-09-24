import type { Context } from "../context";

export interface IService {
  name: string;
  init(context: Context): void;
}
