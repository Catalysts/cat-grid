export class CatGridItemConfig {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fixed?: boolean;
  draggable?: boolean;
  borderSize?: number;
  resizable?: boolean;
  component?: any;
}

export const ITEM_DEFAULT_CONFIG: CatGridItemConfig = {
  x: 1,
  y: 1,
  width: 1,
  height: 1,
  fixed: false,
  draggable: true,
  resizable: true,
  borderSize: 15,
};
