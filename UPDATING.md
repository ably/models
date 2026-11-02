# Upgrade / Migration Guide

## Upgrading from 0.0.4 to 0.1.0

The Models SDK no longer depends on the `ably` package. It now takes a client from [`@ably/pubsub-device`](https://www.npmjs.com/package/@ably/pubsub-device), the Ably Pub/Sub client for browsers, mobile apps and other end-user runtimes, and declares it as a **peer dependency** rather than bundling its own copy.

### Install `@ably/pubsub-device`

Because `@ably/pubsub-device` is now a peer dependency, your application must install it. You can also remove `ably` if nothing else in your application uses it:

```sh
npm uninstall ably
npm install @ably/pubsub-device @ably-labs/models
```

`@ably/pubsub-device` requires Node.js 22 or later for server-side rendering, tests and tooling.

### Create the Ably client with `createClient`

`ModelsClient` now expects a `PubSubClient` instead of an `ably` `Realtime` instance. Replace the `Realtime` constructor with `createClient` and change the import:

```diff
- import { Realtime } from 'ably';
+ import { createClient } from '@ably/pubsub-device';

- const ably = new Realtime({ key: 'YOUR_ABLY_API_KEY' });
+ const ably = createClient({ key: 'YOUR_ABLY_API_KEY', clientId: 'YOUR_CLIENT_ID' });
```

Device connections count toward your account's monthly active users. On an account billed by MAU, a device connection must carry a client ID and is rejected at connect without one, so set `clientId` in the client options or issue tokens that carry one.

### Create the models client with `createModelsClient`

The package no longer has a default export and `ModelsClient` is no longer a class. `ModelsClient` is now an interface, and you create an instance with the `createModelsClient` factory function:

```diff
- import ModelsClient from '@ably-labs/models';
+ import { createModelsClient } from '@ably-labs/models';

- const modelsClient = new ModelsClient({ ably });
+ const modelsClient = createModelsClient({ pubsubClient: ably });
```

`ModelsClient` remains available as a type:

```ts
import type { ModelsClient } from '@ably-labs/models';

let client: ModelsClient;
```

### `ably` is now `pubsubClient`

The option you pass the Ably client in is now called `pubsubClient`, as shown above. The getter that returns the client has been renamed to match and is typed as `PubSubClient`:

```diff
- modelsClient.ably.connection.on(...);
+ modelsClient.pubsubClient.connection.on(...);
```

The rest of the `Model` API is unchanged.

### Update type imports

Import the Ably types you use alongside the Models SDK from `@ably/pubsub-device` instead of `ably`. Replace the `Realtime` (or `Ably.RealtimeClient`) type with `PubSubClient`:

```diff
- import type { Realtime, Message } from 'ably';
+ import type { PubSubClient, Message } from '@ably/pubsub-device';

- function setup(ably: Realtime) {
+ function setup(ably: PubSubClient) {
```

### Client options

`@ably/pubsub-device` replaces the `environment` client option with `endpoint`:

```diff
  const ably = createClient({
    key: 'YOUR_ABLY_API_KEY',
-   environment: 'sandbox',
+   endpoint: 'sandbox',
  });
```

For any other differences between `ably` and `@ably/pubsub-device`, see the [`@ably/pubsub-device` README](https://github.com/ably/ably-js/tree/main/packages/device#readme).
