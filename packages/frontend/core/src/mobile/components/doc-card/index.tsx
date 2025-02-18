import { IconButton } from '@affine/component';
import { useCatchEventCallback } from '@affine/core/components/hooks/use-catch-event-hook';
import { PagePreview } from '@affine/core/components/page-list/page-content-preview';
import { IsFavoriteIcon } from '@affine/core/components/pure/icons';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/favorite';
import {
  WorkbenchLink,
  type WorkbenchLinkProps,
} from '@affine/core/modules/workbench';
import type { DocMeta } from '@blocksuite/affine/store';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import clsx from 'clsx';
import { forwardRef, type ReactNode, useMemo } from 'react';

import * as styles from './styles.css';
import { DocCardTags } from './tag';

const calcRowsById = (id: string) => {
  const [MIN, MAX] = [2, 8];

  const code = id.charCodeAt(0);
  return Math.floor((code % (MAX - MIN)) + MIN);
};

export interface DocCardProps extends Omit<WorkbenchLinkProps, 'to'> {
  meta: {
    id: DocMeta['id'];
    title?: ReactNode;
  } & { [key: string]: any };
  showTags?: boolean;

  /**
   * When enabled, preview's height will be calculated based on `meta.id`
   */
  autoHeightById?: boolean;
}

export const DocCard = forwardRef<HTMLAnchorElement, DocCardProps>(
  function DocCard(
    { showTags = true, meta, className, autoHeightById, ...attrs },
    ref
  ) {
    const favAdapter = useService(CompatibleFavoriteItemsAdapter);
    const workspace = useService(WorkspaceService).workspace;

    const favorited = useLiveData(favAdapter.isFavorite$(meta.id, 'doc'));

    const toggleFavorite = useCatchEventCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        favAdapter.toggle(meta.id, 'doc');
      },
      [favAdapter, meta.id]
    );

    const contentStyle = useMemo(() => {
      if (!autoHeightById) return { flex: 1 };
      const rows = calcRowsById(meta.id);
      return { height: `${rows * 18}px` };
    }, [autoHeightById, meta.id]);

    return (
      <WorkbenchLink
        to={`/${meta.id}`}
        ref={ref}
        className={clsx(styles.card, className)}
        data-testid="doc-card"
        {...attrs}
      >
        <header className={styles.head} data-testid="doc-card-header">
          <h3 className={styles.title}>
            {meta.title || <span className={styles.untitled}>Untitled</span>}
          </h3>
          <IconButton
            aria-label="favorite"
            icon={
              <IsFavoriteIcon onClick={toggleFavorite} favorite={favorited} />
            }
          />
        </header>
        <main className={styles.content} style={contentStyle}>
          <PagePreview
            docCollection={workspace.docCollection}
            pageId={meta.id}
            emptyFallback={<div className={styles.contentEmpty}>Empty</div>}
          />
        </main>
        {showTags ? <DocCardTags docId={meta.id} rows={2} /> : null}
      </WorkbenchLink>
    );
  }
);
