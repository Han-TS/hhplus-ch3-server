export interface IRepository<T, ID = number> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;

  create(entity: T): Promise<T>;
  updateById(id: ID, entity: Partial<T>): Promise<T>;
  deleteById(id: ID): Promise<T>;

  find(options: {
    where?: Partial<T>;
    select?: Partial<Record<keyof T, boolean>>;
    orderBy?: { [K in keyof T]?: "asc" | "desc" } | Array<{ [K in keyof T]?: "asc" | "desc" }>;
  }): Promise<T[]>;
  upsert(options: { where: Partial<T>; create: T; update: Partial<T> }): Promise<T>;
}
