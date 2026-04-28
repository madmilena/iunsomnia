import React, { type FC } from 'react';
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components';

import { Icon } from '~/ui/components/icon';
import { useI18n } from '~/ui/i18n';

import { Link } from '../base/link';

interface HelpExample {
  code: string;
  description: string;
}

const HelpExamples: FC<{ helpExamples: HelpExample[] }> = ({ helpExamples }) => (
  <table className="table--fancy pad-top-sm">
    <tbody>
      {helpExamples.map(({ code, description }) => (
        <tr key={code}>
          <td>
            <code className="selectable">{code}</code>
          </td>
          {description}
        </tr>
      ))}
    </tbody>
  </table>
);

const JSONPathHelp: FC = () => {
  const { t } = useI18n();

  return (
    <div>
      <p>
        {t('modals.use')} <Link href="http://goessner.net/articles/JsonPath/">JSONPath</Link>{' '}
        {t('modals.toFilterResponseBodyBookStoreExamples')}
      </p>
      <HelpExamples
        helpExamples={[
          { code: '$.store.books[*].title', description: t('modals.getTitlesOfAllBooks') },
          { code: '$.store.books[?(@.price < 10)].title', description: t('modals.getBooksCostingLessThan10') },
          { code: '$.store.books[-1:]', description: t('modals.getLastBookInStore') },
          { code: '$.store.books.length', description: t('modals.getNumberOfBooksInStore') },
          {
            code: '$.store.books[?(@.title.match(/lord.*rings/i))]',
            description: t('modals.getBookByTitleRegex'),
          },
        ]}
      />
      <p className="notice info">
        {t('modals.noteThereIs')} <Link href="https://cburgmer.github.io/json-path-comparison/">{t('modals.noStandard')}</Link>{' '}
        {t('modals.forJsonPath')} {t('modals.iusomniaUses')}{' '}
        <Link href="https://www.npmjs.com/package/jsonpath-plus">jsonpath-plus</Link>.
      </p>
    </div>
  );
};

const XPathHelp: FC = () => {
  const { t } = useI18n();

  return (
    <div>
      <p>
        {t('modals.use')} <Link href="https://www.w3.org/TR/xpath/">XPath</Link>{' '}
        {t('modals.toFilterResponseBodyBookStoreExamples')}
      </p>
      <HelpExamples
        helpExamples={[
          { code: '/store/books/title', description: t('modals.getTitlesOfAllBooks') },
          { code: '/store/books[price < 10]', description: t('modals.getBooksCostingLessThan10') },
          { code: '/store/books[last()]', description: t('modals.getLastBookInStore') },
          { code: 'count(/store/books)', description: t('modals.getNumberOfBooksInStore') },
        ]}
      />
    </div>
  );
};
interface FilterHelpModalOptions {
  isJSON: boolean;
}

export const FilterHelpModal: FC<FilterHelpModalOptions> = ({ isJSON }) => {
  const { t } = useI18n();

  return (
    <>
      <DialogTrigger>
        <Button
          key="help"
          className="flex h-full items-center justify-center gap-2 px-4 py-1 text-xs text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
        >
          <i className="fa fa-question-circle" />
        </Button>
        <ModalOverlay
          isDismissable
          className="fixed top-0 left-0 z-10 flex h-(--visual-viewport-height) w-full items-center justify-center bg-black/30"
        >
          <Modal className="flex h-[calc(100%-var(--padding-xl))] w-[calc(100%-var(--padding-xl))] flex-col rounded-md border border-solid border-(--hl-sm) bg-(--color-bg) p-(--padding-lg) text-(--color-font)">
            <Dialog className="flex h-full flex-1 flex-col overflow-hidden outline-hidden data-loading:animate-pulse">
              {({ close }) => (
                <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                  <div className="flex shrink-0 items-center justify-between gap-2">
                    <Heading slot="title" className="flex items-center gap-2 text-2xl">
                      {t('modals.responseFilteringHelp')}
                    </Heading>

                    <Button
                      className="flex aspect-square h-6 shrink-0 items-center justify-center rounded-xs text-sm text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                      onPress={close}
                    >
                      <Icon icon="x" />
                    </Button>
                  </div>

                  <div className="h-full grid-cols-[300px_1fr] gap-2 divide-x divide-solid divide-(--hl-md) overflow-hidden">
                    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                      {isJSON ? <JSONPathHelp /> : <XPathHelp />}
                    </div>
                  </div>
                </div>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
    </>
  );
};
