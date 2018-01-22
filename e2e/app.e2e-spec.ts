import { Angular2GridNewPage } from './app.po';

describe('angular2-grid-new App', function() {
  let page: Angular2GridNewPage;

  beforeEach(() => {
    page = new Angular2GridNewPage();
  });

  it('should display content of grid element', () => {
    page.navigateTo();
    expect(page.getGridElementText()).toEqual('test');
  });
});
