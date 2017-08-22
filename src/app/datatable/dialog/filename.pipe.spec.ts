import { FileNamePipe } from './filename.pipe';

describe('Pipe: Name', () => {
  it('create an instance', () => {
    let pipe = new FileNamePipe();
    expect(pipe).toBeTruthy();
  });
});
