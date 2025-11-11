import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderLayout } from '@backstage/plugin-scaffolder-react';
import { TwoColumnLayout } from './TwoColumnLayout';
import { CardGroupLayout } from './CardGroupLayout';
import { SectionLayout } from './SectionLayout';

export const TwoColumnLayoutExtension = scaffolderPlugin.provide(
  createScaffolderLayout({
    name: 'TwoColumn',
    component: TwoColumnLayout,
  }),
);

export const CardGroupLayoutExtension = scaffolderPlugin.provide(
  createScaffolderLayout({
    name: 'CardGroup',
    component: CardGroupLayout,
  }),
);

export const SectionLayoutExtension = scaffolderPlugin.provide(
  createScaffolderLayout({
    name: 'Section',
    component: SectionLayout,
  }),
);
