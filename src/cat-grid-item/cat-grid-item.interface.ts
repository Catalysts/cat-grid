import { CatGridItemConfig } from './cat-grid-item.config';
import { Observable } from 'rxjs/Observable';

export interface ICatGridItemComponent {
  catGridItemLoaded(config: CatGridItemConfig): void;
  catGridItemResized(config: CatGridItemConfig): void;
  // Observable which has all the data changes of this component
  dataChangedObservable(): Observable<any>;
  // Observable which has all the config changed of this component
  configChangedObservable(): Observable<CatGridItemConfig>;
}
