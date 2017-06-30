import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {UUID} from 'angular2-uuid';
import {NgGridWrapper} from './NgGridWrapper';
import {
  ItemTestComponent
} from './TestComponent';
import {CatGridDirective} from '../../src/cat-grid/cat-grid.directive';
import {CatGridConfig} from '../../src/cat-grid/cat-grid.config';
import {CatGridItemConfig} from '../../src/cat-grid-item/cat-grid-item.config';
import {CatGridValidationService} from '../../src/cat-grid-validation.service';
import {CatGridDragService} from '../../src/cat-grid-drag.service';
import {DragulaService} from 'ng2-dragula/components/dragula.provider';

@Component({
  selector: 'cat-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TestComponent implements OnInit {
  @ViewChild('grid1')
  private ngGrid1: CatGridDirective;
  @ViewChild('grid2')
  private ngGrid2: CatGridDirective;

  private gridConfig = <CatGridConfig>{
    'id': UUID.UUID(),
    'margins': [0],
    'draggable': true,
    'resizable': true,
    'maxCols': 16,
    'maxRows': 30,
    'visibleCols': 0,
    'visibleRows': 0,
    'minCols': 1,
    'minRows': 1,
    'colWidth': 50,
    'rowHeight': 50,
    'cascade': 'off',
    'minWidth': 50,
    'minHeight': 50,
    'fixToGrid': false,
    'autoStyle': true,
    'autoResize': false,
    'maintainRatio': false,
    'preferNew': true,
  };
  private items: CatGridItemConfig[] = [
    {
      id: '1',
      col: 1,
      row: 1,
      sizex: 3,
      sizey: 2,
      component: {
        type: ItemTestComponent, data: {
          name: 'tudor',
          id: '1',
        }
      },
    },
    {
      id: '2',
      col: 9,
      row: 1,
      sizex: 3,
      sizey: 2,
      component: {
        type: ItemTestComponent, data: {
          id: '2',
        }
      },
    },
    {
      id: '4',
      col: 1,
      row: 4,
      sizex: 16,
      sizey: 2,
      draggable: false,
      component: {
        type: ItemTestComponent, data: {
          id: '4',
        }
      },
    },
    {
      id: '5',
      col: 1,
      row: 6,
      sizex: 3,
      sizey: 2,
      draggable: false,
      component: {
        type: ItemTestComponent, data: {
          id: '5',
        }
      },
    },
    {
      id: '6',
      col: 9,
      row: 6,
      sizex: 3,
      sizey: 2,
      component: {
        type: ItemTestComponent, data: {
          id: '6',
        }
      },
    },
    {
      id: '8',
      col: 1,
      row: 12,
      sizex: 16,
      sizey: 2,
      component: {
        type: ItemTestComponent, data: {
          id: '8',
        }
      },
    }
  ];
  private draggable: CatGridItemConfig = {
    id: '23',
    col: 9,
    row: 9,
    sizex: 12,
    sizey: 8,
    component: {
      type: NgGridWrapper,
      data: {
        config: {
          'id': '23',
          'margins': [5],
          'draggable': true,
          'resizable': false,
          'maxCols': 10,
          'maxRows': 10,
          'visibleCols': 0,
          'visibleRows': 0,
          'minCols': 1,
          'minRows': 1,
          'colWidth': 20,
          'rowHeight': 20,
          'cascade': 'off',
          // 'minWidth': 50,
          // 'minHeight': 50,
          'fixToGrid': false,
          'autoStyle': true,
          'autoResize': false,
          'maintainRatio': false,
          'preferNew': true,
        },
        items: [],
      }
    }
  };

  constructor(private gridPositionService: CatGridValidationService, private gridDragService: CatGridDragService,
              private dragulaService: DragulaService) {
    this.gridPositionService.addPositionCondition(this.validatePosition);
    // this.gridPositionService.addResizeCondition(this.validateResize);
    dragulaService.setOptions("cat-ng-grid-bag", {
      copy: true
    });
  }

  ngOnInit() {
  }

  private validatePosition(gridCol: number, gridRow: number): boolean {
    return gridCol % 8 === 1;
  }
}
