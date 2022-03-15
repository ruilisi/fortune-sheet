export type Cell = {
  v: any;
};

export type CellWithRowAndCol = {
  r: number;
  c: number;
  v: Cell;
};

export type Sheet = {
  name: string;
  config?: any;
  data?: (Cell | null)[][];
  celldata?: CellWithRowAndCol[];
  index: number | string;
  zoomRatio: number;
  column?: number;
  row?: number;
  status?: number;
  luckysheet_select_save?: any[];
  calcChain?: any[];
};
