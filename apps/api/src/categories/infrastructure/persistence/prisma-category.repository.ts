import { Injectable } from '@nestjs/common';
import type { CategoryRepositoryPort } from '../../application/ports/category-repository.port';
import { Category, type CategoryKind } from '../../domain/category.entity';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

interface CategoryRecord {
  id: string;
  userId: string;
  name: string;
  kind: string;
}

@Injectable()
export class PrismaCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForOwner(id: string, ownerId: string): Promise<Category | null> {
    const record = await this.prisma.category.findFirst({ where: { id, userId: ownerId } });
    return record ? this.toDomain(record) : null;
  }

  async findByNameAndKindForOwner(
    name: string,
    kind: CategoryKind,
    ownerId: string,
  ): Promise<Category | null> {
    const record = await this.prisma.category.findFirst({ where: { name, kind, userId: ownerId } });
    return record ? this.toDomain(record) : null;
  }

  async listForOwner(ownerId: string): Promise<Category[]> {
    const records = await this.prisma.category.findMany({ where: { userId: ownerId } });
    return records.map((record) => this.toDomain(record));
  }

  async save(category: Category): Promise<Category> {
    await this.prisma.category.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        userId: category.userId,
        name: category.name,
        kind: category.kind,
      },
      update: {
        name: category.name,
        kind: category.kind,
      },
    });
    return category;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  private toDomain(record: CategoryRecord): Category {
    return Category.create({
      id: record.id,
      userId: record.userId,
      name: record.name,
      kind: record.kind as CategoryKind,
    });
  }
}
