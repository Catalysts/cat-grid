import { CatGridItemConfig } from './cat-grid-item/cat-grid-item.config';

export interface CatGridDragResult {
	config: CatGridItemConfig;
	target: EventTarget;
}
