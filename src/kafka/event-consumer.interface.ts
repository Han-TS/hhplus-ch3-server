export interface IEventConsumer {
  getTopic(): string;
  getGroupId(): string;
  handleMessage(message: any): Promise<void>;
}