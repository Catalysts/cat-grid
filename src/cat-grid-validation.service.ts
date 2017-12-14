import { Injectable } from '@angular/core';
import { CatGridItemConfig } from './cat-grid-item/cat-grid-item.config';
import { CatGridConfig } from './cat-grid/cat-grid.config';

// Interface used for the validation function.
// Receives the needed parameters for validation.
export interface ConditionFn {
  (gridX: number, gridY: number, gridItem: CatGridItemConfig, hoveredGrid: CatGridConfig): boolean;
}

/**
 * Angular service used for validation purposes.
 *
 * It can be used to add both position and resize conditions which will determine whether a position is valid
 * or not. The conditions are all grouped together and validated each time needed.
 *
 * Conditions should not be computationally intensive or they will affect the dragging performance!
 */
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

  clearPositionConditions() {
    this.positionConditions = [];
  }

  clearResizeConditions() {
    this.resizeConditions = [];
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
