import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Le Studio est hébergé sur notre VPS (Coolify), pas sur sanity.studio.
  studioHost: undefined,
  autoUpdates: false,
});
