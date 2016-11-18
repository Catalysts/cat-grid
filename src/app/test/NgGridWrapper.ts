/**
 * Created by tudorgergely on 5/24/16.
 */
import {
    Component, Input,
} from '@angular/core';
import {CatGridComponent} from "../cat-grid/cat-grid.component";

@Component({
    selector: 'ngGridWrapper',
    template: `
        <cat-grid [config]="config" [items]="items"></cat-grid>
    `,
})
export class NgGridWrapper {
    @Input()
    public items;
    @Input()
    public config;
}
