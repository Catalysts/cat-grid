export class CatGridItemConfig {
  id?: string;
  col?: number;
  row?: number;
  sizex?: number;
  sizey?: number;
  fixed?: boolean;
  draggable?: boolean;
  borderSize?: number;
  resizable?: boolean;
  component?: any;
}

export const ITEM_DEFAULT_CONFIG = {
  col: 1,
  row: 1,
  sizex: 1,
  sizey: 1,
  fixed: false,
  draggable: true,
  resizable: true,
  borderSize: 15,
};
