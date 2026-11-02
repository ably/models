# CHANGELOG

## 0.1.0

The 0.1.0 release moves the Models SDK onto Ably Pub/Sub v3. The Models SDK runs on end-user devices, so it now works with a client from `@ably/pubsub-device`, the Ably Pub/Sub package for browsers, mobile apps and other end-user runtimes. `@ably/pubsub-device` is a peer dependency, so you install it alongside `@ably-labs/models`.

Below is an overview of the major changes in this release.

Please refer to the [upgrade guide](./UPDATING.md) for the full details, including a list of all breaking changes and instructions on how to address them.

### Ably Pub/Sub v3

- The Models SDK no longer uses the `ably` package. Create the Pub/Sub client you pass to the Models SDK with `createClient` from `@ably/pubsub-device` instead of `new Realtime()`.

### Client API naming

- `ModelsClient` is now an interface. Create clients with the `createModelsClient` factory function instead of `new ModelsClient()`. The package no longer has a default export.
- The `ably` option is renamed `pubsubClient`.
- The `ModelsClient.ably` getter is renamed `pubsubClient`.

### Supported platforms changes

- Support for Node.js versions lower than 22 has been dropped.

## 0.0.1

Initial commit & documentation.
