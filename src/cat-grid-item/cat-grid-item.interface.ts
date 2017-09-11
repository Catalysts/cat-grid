import { CatGridItemConfig } from './cat-grid-item.config';

export interface ICatGridItemComponent {
  catGridItemLoaded(config: CatGridItemConfig): void;
  catGridItemResized(config: CatGridItemConfig): void;
}
