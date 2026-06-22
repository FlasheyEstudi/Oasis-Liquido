import { defineConfig } from 'prisma';

export default defineConfig({
  seed: {
    command: 'npx jiti prisma/seed.ts',
  },
});
