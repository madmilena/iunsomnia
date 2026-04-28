import { Button, Tooltip, TooltipTrigger } from 'react-aria-components';
import { Outlet } from 'react-router';

import { useRootLoaderData } from '~/root';
import { Hotkey } from '~/ui/components/hotkey';
import { Icon } from '~/ui/components/icon';
import { IusomniaLogo } from '~/ui/components/insomnia-icon';
import { showSettingsModal } from '~/ui/components/modals/settings-modal';
import { TrailLinesContainer } from '~/ui/components/trail-lines-container';

const Component = () => {
  const { settings } = useRootLoaderData()!;

  return (
    <div className="grid h-full w-full grid-rows-[1fr_30px]">
      <div className="relative flex h-full w-full bg-(--color-bg) text-center">
        <TrailLinesContainer>
          <div className="flex h-full min-h-[450px] flex-col items-center justify-center">
            <div className="relative m-0 flex max-w-lg min-w-[400px] flex-col items-center justify-center gap-(--padding-sm) rounded-md bg-(--hl-sm) p-(--padding-lg) pt-[32px]">
              <IusomniaLogo
                width={64}
                height={64}
                style={{
                  transform: 'translate(-50%, -50%)',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                }}
              />
              <Outlet />
            </div>
          </div>
        </TrailLinesContainer>
      </div>
      <div className="relative flex items-center overflow-hidden">
        <div className="flex h-full w-full items-center justify-between">
          <div className="flex h-full">
            <TooltipTrigger>
              <Button
                data-testid="settings-button"
                className="flex h-full items-center justify-center gap-2 px-4 py-1 text-xs text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                onPress={() => showSettingsModal()}
              >
                <Icon icon="gear" /> Preferences
              </Button>
              <Tooltip
                placement="top"
                offset={8}
                className="flex max-h-[85vh] min-w-max items-center gap-2 overflow-y-auto rounded-md border border-solid border-(--hl-sm) bg-(--color-bg) px-4 py-2 text-sm text-(--color-font) shadow-lg select-none focus:outline-hidden"
              >
                Preferences
                <Hotkey keyBindings={settings.hotKeyRegistry.preferences_showGeneral} />
              </Tooltip>
            </TooltipTrigger>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Component;
