import type { PubSubClient } from '@ably/pubsub-device';
import pino from 'pino';

import { InvalidArgumentError } from './Errors.js';
import Model from './Model.js';
import { defaultEventBufferOptions, defaultOptimisticEventOptions, defaultSyncOptions } from './Options.js';
import type { ModelsOptions, ModelOptions, ModelSpec, SyncFuncConstraint } from './types/model.js';
import type { OptimisticEventOptions, SyncOptions } from './types/optimistic.js';
import type { EventBufferOptions } from './types/stream.js';
import { VERSION } from './version.js';

interface AblyClientWithOptions extends PubSubClient {
  options?: {
    agents?: Record<string, string | boolean>;
  };
}

/**
 * ModelsClient captures the set of named Model instances used by your application.
 * And provides methods to construct a new model.
 */
export interface ModelsClient {
  /**
   * The Ably Pub/Sub client shared by all models.
   */
  readonly pubsubClient: PubSubClient;

  /**
   * Namespace for getting an existing model instance or creating a new model instance.
   */
  readonly models: {
    /**
     * Gets an existing or creates a new model instance with the given name.
     * @template S - The sync function type.
     * @param {ModelSpec} spec - The channelName, sync and merge functions for this model.
     * The name and functions will be automatically setup on the model returned.
     * The model will not start until you call model.sync() or model.subscribe()
     * @returns {Model} The model instance.
     */
    get<S extends SyncFuncConstraint>(spec: ModelSpec<S>): Model<S>;
  };
}

/**
 * Creates a new ModelsClient.
 * @param {ModelsOptions} options - Options used to configure all models instantiated here, including the underlying Ably client.
 * @returns {ModelsClient} The new ModelsClient.
 */
export function createModelsClient(options: ModelsOptions): ModelsClient {
  return new DefaultModelsClient(options);
}

/**
 * The default implementation of {@link ModelsClient}.
 */
export class DefaultModelsClient implements ModelsClient {
  private opts: Omit<ModelOptions, 'channelName'>;
  private modelInstances: Record<string, Model<any>> = {};

  /**
   * Constructs a new DefaultModelsClient instance.
   * @param {ModelsOptions} options - Options used to configure all models instantiated here, including the underlying Ably client.
   */
  constructor(private readonly options: ModelsOptions) {
    if (!this.isModelsOptions(options)) {
      throw new InvalidArgumentError('expected options to be a ModelsOptions');
    }

    this.modelInstances = {};
    const optimisticEventOptions: OptimisticEventOptions = Object.assign(
      {},
      defaultOptimisticEventOptions,
      this.options.optimisticEventOptions,
    );
    const eventBufferOptions: EventBufferOptions = Object.assign(
      {},
      defaultEventBufferOptions,
      this.options.eventBufferOptions,
    );
    const syncOptions: SyncOptions = Object.assign({}, defaultSyncOptions, this.options.syncOptions);
    this.opts = {
      logger: pino({ level: options.logLevel || 'silent' }),
      pubsubClient: options.pubsubClient,
      syncOptions,
      optimisticEventOptions,
      eventBufferOptions,
    };
    this.addAgent(this.opts.pubsubClient as AblyClientWithOptions);
    this.options.pubsubClient.time();
  }

  private addAgent(client: AblyClientWithOptions) {
    const agent = { models: VERSION };
    if (!client['options']) {
      client['options'] = {};
    }
    client['options'].agents = { ...client['options'].agents, ...agent };
  }

  /**
   * @returns {PubSubClient} The Ably Pub/Sub client shared by all models.
   */
  get pubsubClient(): PubSubClient {
    return this.options.pubsubClient;
  }

  /**
   * Namespace for getting an existing model instance or creating a new model instance.
   * @returns {Object} An object with a get method for getting an existing model instance or creating a new model instance.
   */
  get models(): ModelsClient['models'] {
    return {
      /**
       * Gets an existing or creates a new model instance with the given name.
       * @template S - The sync function type.
       * @param {ModelSpec} spec - The channelName, sync and merge functions for this model.
       * The name and functions will be automatically setup on the model returned.
       * The model will not start until you call model.sync() or model.subscribe()
       * @returns {Model} The model instance.
       */
      get: <S extends SyncFuncConstraint>(spec: ModelSpec<S>) => {
        if (!this.isModelSpec<S>(spec)) {
          throw new InvalidArgumentError('expected spec to be a ModelSpec');
        }

        const channelName = spec.channelName;

        if (!channelName) {
          throw new InvalidArgumentError('Model must have a non-empty channel name');
        }

        if (this.modelInstances[channelName]) {
          return this.modelInstances[channelName] as Model<S>;
        }

        const model = new Model<S>(channelName, spec, { ...this.opts, channelName });
        this.modelInstances[channelName] = model;

        return model as Model<S>;
      },
    };
  }

  private isModelsOptions(options: any): options is ModelsOptions {
    return options && typeof options.pubsubClient === 'object';
  }

  private isModelSpec<S extends SyncFuncConstraint>(spec: any): spec is ModelSpec<S> {
    return (
      spec &&
      spec.channelName &&
      typeof spec.channelName === 'string' &&
      spec.sync &&
      typeof spec.sync === 'function' &&
      spec.merge &&
      typeof spec.merge === 'function'
    );
  }
}
