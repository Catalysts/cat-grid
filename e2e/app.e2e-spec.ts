import { Angular2GridNewPage } from './app.po';

describe('angular2-grid-new App', function() {
  let page: Angular2GridNewPage;

  beforeEach(() => {
    page = new Angular2GridNewPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
