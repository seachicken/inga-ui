import { defineConfig } from '@twind/core';
import presetAutoprefix from '@twind/preset-autoprefix';
import presetTailwind from '@twind/preset-tailwind';
import * as colors from 'twind/colors';
import tokens from './tokens.json';

export default defineConfig({
  hash: false,
  presets: [presetAutoprefix(), presetTailwind()],
  theme: {
    colors: {
      black: colors.black,
      blue: colors.blue,
      green: tokens.global.green.value,
      gray: colors.trueGray,
      white: colors.white,
    },
  },
});
