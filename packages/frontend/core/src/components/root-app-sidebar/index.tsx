import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import {
  AddPageButton,
  AppDownloadButton,
  AppSidebar,
  CategoryDivider,
  MenuItem,
  MenuLinkItem,
  QuickSearchInput,
  SidebarContainer,
  SidebarScrollableContainer,
} from '@affine/core/modules/app-sidebar/views';
import { ExternalMenuLinkItem } from '@affine/core/modules/app-sidebar/views/menu-item/external-menu-link-item';
import {
  GlobalDialogService,
  WorkspaceDialogService,
} from '@affine/core/modules/dialogs';
import {
  ExplorerCollections,
  ExplorerFavorites,
  ExplorerMigrationFavorites,
  ExplorerOrganize,
} from '@affine/core/modules/explorer';
import { ExplorerTags } from '@affine/core/modules/explorer/views/sections/tags';
import { CMDKQuickSearchService } from '@affine/core/modules/quicksearch/services/cmdk';
import { isNewTabTrigger } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import type { Doc } from '@blocksuite/affine/store';
import {
  AllDocsIcon,
  GithubIcon,
  ImportIcon,
  JournalIcon,
  SettingsIcon,
} from '@blocksuite/icons/rc';
import type { Workspace } from '@toeverything/infra';
import {
  useLiveData,
  useService,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import type { MouseEvent, ReactElement } from 'react';
import { useCallback } from 'react';

import { WorkbenchService } from '../../modules/workbench';
import { usePageHelper } from '../blocksuite/block-suite-page-list/utils';
import { WorkspaceNavigator } from '../workspace-selector';
import {
  quickSearch,
  quickSearchAndNewPage,
  workspaceAndUserWrapper,
  workspaceWrapper,
} from './index.css';
import { AppSidebarJournalButton } from './journal-button';
import { TrashButton } from './trash-button';
import { UpdaterButton } from './updater-button';
import { UserInfo } from './user-info';

export type RootAppSidebarProps = {
  isPublicWorkspace: boolean;
  onOpenQuickSearchModal: () => void;
  onOpenSettingModal: () => void;
  currentWorkspace: Workspace;
  openPage: (pageId: string) => void;
  createPage: () => Doc;
  paths: {
    all: (workspaceId: string) => string;
    trash: (workspaceId: string) => string;
    shared: (workspaceId: string) => string;
  };
};

/**
 * This is for the whole affine app sidebar.
 * This component wraps the app sidebar in `@affine/component` with logic and data.
 *
 */
export const RootAppSidebar = (): ReactElement => {
  const { workbenchService, workspaceService, cMDKQuickSearchService } =
    useServices({
      WorkspaceService,
      WorkbenchService,
      CMDKQuickSearchService,
    });
  const currentWorkspace = workspaceService.workspace;
  const t = useI18n();
  const globalDialogService = useService(GlobalDialogService);
  const workspaceDialogService = useService(WorkspaceDialogService);
  const workbench = workbenchService.workbench;
  const currentPath = useLiveData(
    workbench.location$.map(location => location.pathname)
  );
  const onOpenQuickSearchModal = useCallback(() => {
    cMDKQuickSearchService.toggle();
  }, [cMDKQuickSearchService]);

  const allPageActive = currentPath === '/all';

  const pageHelper = usePageHelper(currentWorkspace.docCollection);

  const onClickNewPage = useAsyncCallback(
    async (e?: MouseEvent) => {
      pageHelper.createPage(undefined, isNewTabTrigger(e) ? 'new-tab' : true);
      track.$.navigationPanel.$.createDoc();
    },
    [pageHelper]
  );

  const onOpenSettingModal = useCallback(() => {
    globalDialogService.open('setting', {
      activeTab: 'appearance',
    });
    track.$.navigationPanel.$.openSettings();
  }, [globalDialogService]);

  const handleOpenDocs = useCallback(
    (result: {
      docIds: string[];
      entryId?: string;
      isWorkspaceFile?: boolean;
    }) => {
      const { docIds, entryId, isWorkspaceFile } = result;
      // If the imported file is a workspace file, open the entry page.
      if (isWorkspaceFile && entryId) {
        workbench.openDoc(entryId);
      } else if (!docIds.length) {
        return;
      }
      // Open all the docs when there are multiple docs imported.
      if (docIds.length > 1) {
        workbench.openAll();
      } else {
        // Otherwise, open the only doc.
        workbench.openDoc(docIds[0]);
      }
    },
    [workbench]
  );

  const onOpenImportModal = useCallback(() => {
    track.$.navigationPanel.importModal.open();
    workspaceDialogService.open('import', undefined, payload => {
      if (!payload) {
        return;
      }
      handleOpenDocs(payload);
    });
  }, [workspaceDialogService, handleOpenDocs]);

  return (
    <AppSidebar>
      <SidebarContainer>
        <div className={workspaceAndUserWrapper}>
          <div className={workspaceWrapper}>
            <WorkspaceNavigator
              showEnableCloudButton
              showSettingsButton
              showSyncStatus
            />
          </div>
          <UserInfo />
        </div>
        <div className={quickSearchAndNewPage}>
          <QuickSearchInput
            className={quickSearch}
            data-testid="slider-bar-quick-search-button"
            data-event-props="$.navigationPanel.$.quickSearch"
            onClick={onOpenQuickSearchModal}
          />
          <AddPageButton onClick={onClickNewPage} />
        </div>
        <MenuLinkItem icon={<AllDocsIcon />} active={allPageActive} to={'/all'}>
          <span data-testid="all-pages">
            {t['com.affine.workspaceSubPath.all']()}
          </span>
        </MenuLinkItem>
        <AppSidebarJournalButton />
        <MenuItem
          data-testid="slider-bar-workspace-setting-button"
          icon={<SettingsIcon />}
          onClick={onOpenSettingModal}
        >
          <span data-testid="settings-modal-trigger">
            {t['com.affine.settingSidebar.title']()}
          </span>
        </MenuItem>
      </SidebarContainer>
      <SidebarScrollableContainer>
        <ExplorerFavorites />
        <ExplorerOrganize />
        <ExplorerMigrationFavorites />
        <ExplorerCollections />
        <ExplorerTags />
        <CategoryDivider label={t['com.affine.rootAppSidebar.others']()} />
        <div style={{ padding: '0 8px' }}>
          <TrashButton />
          <MenuItem
            data-testid="slider-bar-import-button"
            icon={<ImportIcon />}
            onClick={onOpenImportModal}
          >
            <span data-testid="import-modal-trigger">{t['Import']()}</span>
          </MenuItem>
          <ExternalMenuLinkItem
            href="https://affine.pro/blog?tag=Release+Note"
            icon={<JournalIcon />}
            label={t['com.affine.app-sidebar.learn-more']()}
          />
          <ExternalMenuLinkItem
            href="https://github.com/toeverything/affine"
            icon={<GithubIcon />}
            label={t['com.affine.app-sidebar.star-us']()}
          />
        </div>
      </SidebarScrollableContainer>
      <SidebarContainer>
        {BUILD_CONFIG.isElectron ? <UpdaterButton /> : <AppDownloadButton />}
      </SidebarContainer>
    </AppSidebar>
  );
};

RootAppSidebar.displayName = 'memo(RootAppSidebar)';
