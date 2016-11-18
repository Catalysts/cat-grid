export interface CatGridConfig {
  id: string;
  margins?: number[];
  draggable?: boolean;
  resizable?: boolean;
  maxCols?: number;
  maxRows?: number;
  visibleCols?: number;
  visibleRows?: number;
  minCols?: number;
  minRows?: number;
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
