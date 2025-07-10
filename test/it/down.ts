// test/it/example/teardown.ts
export default async () => {
  if (globalThis.__DB_CONTAINER__) {
    await globalThis.__DB_CONTAINER__.stop();
    console.log('🧹 MySQL TestContainer stopped');
  }

  if(globalThis.__REDIS_CONTAINER__) {
    await globalThis.__REDIS_CONTAINER__.stop();
    console.log('🧹 Redis TestContainer stopped');
  }

  if(globalThis.__KAFKA_CONTAINER__) {
    await globalThis.__KAFKA_CONTAINER__.stop();
    console.log('🧹 Kafka TestContainer stopped')
  }
};
