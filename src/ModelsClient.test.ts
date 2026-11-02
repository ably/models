import { createClient, PubSubClient } from '@ably/pubsub-device';
import { vi, it, describe, expect, expectTypeOf, beforeEach } from 'vitest';

import { InvalidArgumentError } from './Errors.js';
import { createModelsClient } from './ModelsClient.js';
import { VERSION } from './version.js';

interface ModelsTestContext {
  ably: PubSubClient;
  channelName: string;
}

vi.mock('@ably/pubsub-device');

describe('ModelsClient', () => {
  beforeEach<ModelsTestContext>((context) => {
    context.ably = createClient({ key: 'abc:def' });
    context.channelName = 'models:myTestModel:updates';

    // make sure the various channel and connection
    // functions are mounted on the ably realtime mock
    const ablyChannel = context.ably.channels.get(context.channelName);
    ablyChannel.on = vi.fn<any, any>();
    ablyChannel.subscribe = vi.fn<any, any>();
    context.ably.connection.whenState = vi.fn<any, any>();
  });

  it<ModelsTestContext>('correctly instantiates the models client', ({ ably }) => {
    const modelsClient = createModelsClient({ pubsubClient: ably });
    expect(modelsClient.pubsubClient).toBe(ably);
    expectTypeOf(modelsClient.pubsubClient).toMatchTypeOf<PubSubClient>();
    expect(modelsClient.pubsubClient['options']).toEqual({ agents: { models: VERSION } });
  });

  it<ModelsTestContext>('rejects the renamed ably option with a helpful error', ({ ably }) => {
    expect(() => createModelsClient({ ably } as any)).toThrowError(
      new InvalidArgumentError('the `ably` option has been renamed to `pubsubClient`'),
    );
  });

  it<ModelsTestContext>('preserves existing agent', ({ ably }) => {
    ably['options'] = { agents: { foo: 'bar' } };
    const modelsClient = createModelsClient({ pubsubClient: ably });
    expectTypeOf(modelsClient.pubsubClient).toMatchTypeOf<PubSubClient>();
    expect(modelsClient.pubsubClient['options']).toEqual({ agents: { models: VERSION, foo: 'bar' } });
  });

  it<ModelsTestContext>('getting a model with the same name returns the same instance', async ({
    ably,
    channelName,
  }) => {
    const modelsClient = createModelsClient({ pubsubClient: ably });
    const model1 = modelsClient.models.get({
      channelName: channelName,
      sync: async (page: number) => {
        return { data: 'initial data', sequenceId: '0', page };
      },
      merge: () => 'merged',
    });
    expect(model1.name).toEqual(channelName);

    const model2 = modelsClient.models.get({
      channelName: channelName,
      sync: async () => ({ data: 'initial data', sequenceId: '0' }),
      merge: () => 'merged',
    });
    expect(model2.name).toEqual(channelName);
    expect(model1).toEqual(model2);
  });
});
