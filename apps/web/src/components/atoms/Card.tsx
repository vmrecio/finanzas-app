import type { ElementType, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Underlying element/tag to render — defaults to `div`. Lets callers keep
   * meaningful semantics (e.g. `section`) while reusing the same card look. */
  as?: ElementType;
}

/**
 * Level-1 tonal card container per DESIGN.md's elevation rules (white
 * surface, 1px outline, no shadow at rest). Pure presentational — used
 * across every screen to avoid duplicating the same card class soup.
 */
export function Card({ as: Tag = 'div', className = '', ...rest }: CardProps) {
  return <Tag className={`card-level-1 rounded-xl ${className}`} {...rest} />;
}
