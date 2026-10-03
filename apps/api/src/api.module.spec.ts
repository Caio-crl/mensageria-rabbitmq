import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ApiModule } from './api.module';

describe('ApiModule', () => {
  it('registers TypeORM without opening a database connection', async () => {
    const dataSource = {};
    const module = await Test.createTestingModule({
      imports: [ApiModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    expect(module.get(ApiModule)).toBeInstanceOf(ApiModule);
    expect(module.get(getDataSourceToken())).toBe(dataSource);
    await module.close();
  });
});
