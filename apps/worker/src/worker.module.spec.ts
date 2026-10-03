import { Test } from '@nestjs/testing';
import { WorkerModule } from './worker.module';

describe('WorkerModule', () => {
  it('compiles as an independent Nest application', async () => {
    const module = await Test.createTestingModule({
      imports: [WorkerModule],
    }).compile();

    expect(module.get(WorkerModule)).toBeInstanceOf(WorkerModule);
    await module.close();
  });
});
