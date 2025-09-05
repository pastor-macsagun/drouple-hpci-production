import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/colors.ts',
    'src/typography.ts', 
    'src/spacing.ts',
    'src/motion.ts',
    'src/radii.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
});