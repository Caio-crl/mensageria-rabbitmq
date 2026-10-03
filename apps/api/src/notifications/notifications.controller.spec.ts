import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController GET /notifications/:id', () => {
  const id = '876f55eb-0bed-466e-bab4-7d478c8b1fb3';
  const missingId = '00000000-0000-4000-8000-000000000001';
  const findById = jest.fn();
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: { findById } }],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  beforeEach(() => findById.mockReset());

  afterAll(async () => app.close());

  it('returns 200 with the mapped response', async () => {
    findById.mockResolvedValue({
      id,
      type: 'EMAIL',
      recipient: 'user@example.com',
      status: 'SENT',
      createdAt: new Date('2026-10-03T12:00:00.000Z'),
      processedAt: new Date('2026-10-03T12:00:05.000Z'),
    });

    const response = await fetch(`${baseUrl}/notifications/${id}`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id,
      type: 'EMAIL',
      recipient: 'user@example.com',
      status: 'SENT',
      createdAt: '2026-10-03T12:00:00.000Z',
      processedAt: '2026-10-03T12:00:05.000Z',
    });
    expect(findById).toHaveBeenCalledWith(id);
  });

  it('returns 400 for a malformed UUID before calling the service', async () => {
    const response = await fetch(`${baseUrl}/notifications/not-a-uuid`);

    expect(response.status).toBe(400);
    expect(findById).not.toHaveBeenCalled();
  });

  it('returns 404 for a valid UUID absent from the database', async () => {
    findById.mockRejectedValue(new NotFoundException('Notification not found'));

    const response = await fetch(`${baseUrl}/notifications/${missingId}`);

    expect(response.status).toBe(404);
    expect(findById).toHaveBeenCalledWith(missingId);
  });

  it('does not expose a notification list route', async () => {
    const response = await fetch(`${baseUrl}/notifications`);

    expect(response.status).toBe(404);
    expect(findById).not.toHaveBeenCalled();
  });

  it('documents only the public notification operations and fields', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Notification Service API').build(),
    );

    expect(Object.keys(document.paths).sort()).toEqual([
      '/notifications',
      '/notifications/{id}',
    ]);
    expect(
      Object.keys(document.paths['/notifications'].post!.responses),
    ).toEqual(['202', '400', '503']);
    expect(
      Object.keys(document.paths['/notifications/{id}'].get!.responses),
    ).toEqual(['200', '400', '404']);
    expect(document.components?.schemas).toMatchObject({
      NotificationType: { enum: ['EMAIL'] },
      NotificationStatus: {
        enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
      },
      NotificationResponseDto: {
        properties: { processedAt: { nullable: true } },
      },
    });
    expect(
      JSON.stringify(document.components?.schemas?.NotificationResponseDto),
    ).not.toMatch(/subject|message|updatedAt/);
  });
});
