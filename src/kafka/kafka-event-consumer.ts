import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { IEventConsumer } from "./event-consumer.interface";

@Injectable()
export class KafkaEventConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumers: Consumer[] = [];
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = process.env.KAFKA_TEST_MODE === 'true';
  }

  async onModuleInit() {
    if(this.isTestMode) {
      this.kafka = new Kafka({
        clientId: 'ecommerce-server',
        brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`]
      })
    } else {
      this.kafka = new Kafka({
        clientId: 'ecommerce-server',
        brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
      });
    }
  }

  async register(consumerImpl: IEventConsumer) {
    const consumer = this.kafka.consumer({ 
      groupId: consumerImpl.getGroupId(),
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 60000,
    });

    await consumer.connect();
    await consumer.subscribe({ topic: consumerImpl.getTopic(), fromBeginning: false });
    
    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const message = payload.message.value?.toString();
        if(!message) return;

        try {
          const parsed = JSON.parse(message);
          await consumerImpl.handleMessage(parsed);
        } catch (err) {
          console.error(`[Kafka][${consumerImpl.getTopic()}] Error`, err);
        }
      }
    });

    this.consumers.push(consumer);
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers) {
      try {
        await consumer.disconnect();
      } catch (err) {
        console.error('Kafka] Consumer disconnect error: ', err);
      }
    }
  }
}