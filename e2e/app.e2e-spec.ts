import { WavePage } from './app.po';

describe('wave App', function() {
  let page: WavePage;

  beforeEach(() => {
    page = new WavePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
