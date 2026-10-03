import { Test } from '@nestjs/testing';
import { ApiModule } from './api.module';

describe('ApiModule', () => {
  it('compiles as an independent Nest application', async () => {
    const module = await Test.createTestingModule({
      imports: [ApiModule],
    }).compile();

    expect(module.get(ApiModule)).toBeInstanceOf(ApiModule);
    await module.close();
  });
});
