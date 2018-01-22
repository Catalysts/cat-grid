import { browser, element, by } from 'protractor';

export class Angular2GridNewPage {
  navigateTo() {
    return browser.get('/');
  }

  getGridElementText() {
    return element(by.css('cat-grid cat-grid-item test')).getText();
  }
}
