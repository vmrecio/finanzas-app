export const CATEGORY_KINDS = ['income', 'expense'] as const;

export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export interface CreateCategoryProps {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
}

/**
 * Domain entity for a transaction taxonomy label (see design.md "Domain
 * Model"). Framework-free: knows nothing about Prisma or HTTP. Uniqueness of
 * (userId, name, kind) is an application-layer concern (requires querying
 * existing records), not a domain invariant — see
 * design.md "Requirement: Category Creation".
 */
export class Category {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly kind: CategoryKind,
  ) {}

  static create(props: CreateCategoryProps): Category {
    const name = props.name.trim();

    if (name.length === 0) {
      throw new Error('Category name must not be empty');
    }

    if (!CATEGORY_KINDS.includes(props.kind)) {
      throw new Error(`Category kind must be one of: ${CATEGORY_KINDS.join(', ')}`);
    }

    return new Category(props.id, props.userId, name, props.kind);
  }
}
