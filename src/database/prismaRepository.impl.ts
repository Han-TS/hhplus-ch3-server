import { Prisma } from "@prisma/client";
import { IRepository } from "./repository.interface";

export class PrismaRepository<T, ID = number> implements IRepository<T, ID> {
  constructor(
    protected readonly tx: Prisma.TransactionClient,
    protected readonly getModel: (client: Prisma.TransactionClient) => any,
  ) {}

  async findAll(tx?: Prisma.TransactionClient): Promise<T[]> {
    const model = this.getModel(tx ?? this.tx);

    return model.findMany();
  }

  async findById(id: ID, tx?: Prisma.TransactionClient): Promise<T | null> {
    const model = this.getModel(tx ?? this.tx);

    return model.findUnique({
      where: { id },
    });
  }

  async create(entity: Omit<T, "id">, tx?: Prisma.TransactionClient): Promise<T> {
    const model = this.getModel(tx ?? this.tx);

    return model.create({
      data: entity,
    });
  }

  async updateById(id: ID, entity: Partial<T>, tx?: Prisma.TransactionClient): Promise<T> {
    const model = this.getModel(tx ?? this.tx);

    return model.update({
      where: { id },
      data: entity,
    });
  }

  async deleteById(id: ID, tx?: Prisma.TransactionClient): Promise<T> {
    const model = this.getModel(tx ?? this.tx);

    return model.delete({
      where: { id },
    });
  }

  async find(options: {
    where?: Partial<T>;
    select?: Partial<Record<keyof T, boolean>>;
    orderBy?: { [K in keyof T]?: "asc" | "desc" } | Array<{ [K in keyof T]?: "asc" | "desc" }>;
  }, tx?: Prisma.TransactionClient): Promise<T[]> {
    const model = this.getModel(tx ?? this.tx);

    return model.findMany({
      where: options.where,
      select: options.select,
      orderBy: options.orderBy,
    });
  }

  async upsert(options: { where: Partial<T>; create: T; update: Partial<T> }, tx?: Prisma.TransactionClient): Promise<T> {
    const model = this.getModel(tx ?? this.tx);

    return model.upsert({
      where: options.where,
      create: options.create,
      update: options.update,
    });
  }
}
