import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../../../libs/notifications/src/notification.entity';
import { NotificationWorker } from './notification.worker';
import { WorkerModule } from './worker.module';

describe('WorkerModule', () => {
  it('compiles as an independent Nest application', async () => {
    const dataSource = {};
    const module = await Test.createTestingModule({
      imports: [WorkerModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .overrideProvider(getRepositoryToken(Notification))
      .useValue({})
      .compile();

    expect(module.get(WorkerModule)).toBeInstanceOf(WorkerModule);
    expect(module.get(NotificationWorker)).toBeInstanceOf(NotificationWorker);
    expect(module.get(getDataSourceToken())).toBe(dataSource);
    await module.close();
  });
});
