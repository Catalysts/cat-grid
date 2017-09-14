export class CatGridConfig {
  id: string;
  margins?: number[];
  draggable?: boolean;
  resizable?: boolean;
  maxCols?: number;
  maxRows?: number;
  visibleCols?: number;
  visibleRows?: number;
  cols?: number;
  rows?: number;
  colWidth?: number;
  rowHeight?: number;
  minWidth?: number;
  minHeight?: number;
  fixToGrid?: boolean;
  autoStyle?: boolean;
  autoResize?: boolean;
  maintainRatio?: boolean;
  preferNew?: boolean;
  width?: any;
  height?: any;
}

export const CONST_DEFAULT_CONFIG: CatGridConfig = {
  id: '',
  margins: [10],
  draggable: true,
  resizable: true,
  maxCols: 0,
  maxRows: 0,
  visibleCols: 0,
  visibleRows: 0,
  colWidth: 250,
  rowHeight: 250,
  minWidth: 0,
  minHeight: 0,
  fixToGrid: false,
  autoStyle: true,
  autoResize: false,
  maintainRatio: false,
  preferNew: false,
  width: '100%',
  height: '100%'
};
