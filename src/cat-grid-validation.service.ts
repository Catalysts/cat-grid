import {Injectable} from '@angular/core';
import {CatGridItemConfig} from './cat-grid-item/cat-grid-item.config';
import {CatGridConfig} from './cat-grid/cat-grid.config';

export interface ConditionFn {
  (gridX: number, gridY: number, gridItem: CatGridItemConfig, hoveredGrid: CatGridConfig): boolean;
}

@Injectable()
export class CatGridValidationService {
  private positionConditions: ConditionFn[] = [];
  private resizeConditions: ConditionFn[] = [];

  addPositionCondition(condition: ConditionFn) {
    this.positionConditions.push(condition);
  }

  addResizeCondition(condition: ConditionFn) {
    this.resizeConditions.push(condition);
  }

  validateConditions(gridX: number,
                     gridY: number,
                     gridItem: CatGridItemConfig,
                     hoveredGrid: CatGridConfig,
                     conditions: ConditionFn[]): boolean {
    return conditions
      .map(condition => condition(gridX, gridY, gridItem, hoveredGrid))
      .reduce((a, b) => a && b, true);
  }

  validateGridPosition(gridX: number,
                       gridY: number,
                       gridItem: CatGridItemConfig,
                       hoveredGrid: CatGridConfig): boolean {
    return this.validateConditions(gridX, gridY, gridItem, hoveredGrid, this.positionConditions);
  }

  validateResize(gridX: number,
                 gridY: number,
                 gridItem: CatGridItemConfig,
                 hoveredGrid: CatGridConfig): boolean {
    return this.validateConditions(gridX, gridY, gridItem, hoveredGrid, this.resizeConditions);
  }
}
