import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let mysql_container: StartedMySqlContainer;
let redis_container: StartedRedisContainer;
let kafka_container: StartedKafkaContainer;

export default async () => {
  mysql_container = await new MySqlContainer('mysql:8')
    .withUsername('test')
    .withRootPassword('test')
    .withDatabase('testdb')
    .withCopyFilesToContainer([
      {
        source: path.resolve(__dirname, './import.sql'),
        target: '/docker-entrypoint-initdb.d/init.sql'
      }
    ])
    .start();

  const databaseUrl = `mysql://test:test@${mysql_container.getHost()}:${mysql_container.getMappedPort(3306)}/testdb`;

  process.env.TEST_DATABASE_URL = databaseUrl;

  console.log('📦 MySQL TestContainer started:', databaseUrl);

  // Run Prisma migrations
  execSync(`npx prisma db push --force-reset --skip-generate`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });

  // redis container
  redis_container = await new RedisContainer().start();
  const redisHost = redis_container.getHost();
  const redisPort = redis_container.getMappedPort(6379);

  process.env.REDIS_CLUSTER_MODE = 'false';
  process.env.REDIS_HOST = redisHost;
  process.env.REDIS_PORT = redisPort.toString();

  // kafka container
  kafka_container = await new KafkaContainer('confluentinc/cp-kafka:7.2.1').start();
  const kafkaHost = kafka_container.getHost();
  const kafkaPort = kafka_container.getMappedPort(9093);

  process.env.KAFKA_TEST_MODE = 'true';
  process.env.KAFKA_HOST = kafkaHost;
  process.env.KAFKA_PORT = kafkaPort.toString();

  // Save container for teardown
  globalThis.__DB_CONTAINER__ = mysql_container;
  globalThis.__REDIS_CONTAINER__ = redis_container;
  globalThis.__KAFKA_CONTAINER__ = kafka_container;
};
