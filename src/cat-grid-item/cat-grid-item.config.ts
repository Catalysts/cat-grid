export class CatGridItemConfig {
  id: string;
  col?: number;
  row?: number;
  colSpan?: number;
  rowSpan?: number;
  fixed?: boolean;
  draggable?: boolean;
  borderSize?: number;
  resizable?: boolean;
  component?: any;
}

export const ITEM_DEFAULT_CONFIG: CatGridItemConfig = {
  id: '1',
  col: 1,
  row: 1,
  colSpan: 1,
  rowSpan: 1,
  fixed: false,
  draggable: true,
  resizable: true,
  borderSize: 15,
};
