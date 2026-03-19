import type { AstroIntegration } from 'astro';
import { VitePWA } from 'vite-plugin-pwa';
import type { VitePWAOptions } from 'vite-plugin-pwa';

interface PWAContext {
  api: any;
  doBuild: boolean;
  scope: string;
  trailingSlash: 'always' | 'never' | 'ignore';
  useDirectoryFormat: boolean;
}

function createManifestTransform(ctx: PWAContext) {
  return async (entries: Array<{ url: string; revision: string | null; size: number }>) => {
    if (!ctx.doBuild)
      return { manifest: entries, warnings: [] };

    entries.filter(e => e && e.url.endsWith('.html')).forEach(e => {
      const url = e.url.startsWith('/') ? e.url.slice(1) : e.url;
      if (url === 'index.html') {
        e.url = ctx.scope;
      } else {
        const parts = url.split('/');
        parts[parts.length - 1] = parts[parts.length - 1].replace(/\.html$/, '');
        e.url = ctx.useDirectoryFormat
          ? parts.length > 1 ? parts.slice(0, parts.length - 1).join('/') : parts[0]
          : parts.join('/');
        if (ctx.trailingSlash === 'always')
          e.url += '/';
      }
    });

    return { manifest: entries, warnings: [] };
  };
}

export default function pwaIntegration(options: Partial<VitePWAOptions> = {}): AstroIntegration {
  const ctx: PWAContext = {
    api: undefined,
    doBuild: false,
    scope: '/',
    trailingSlash: 'ignore',
    useDirectoryFormat: true,
  };

  return {
    name: 'nantyara-pwa',
    hooks: {
      'astro:config:setup': ({ command, config, updateConfig }) => {
        if (command === 'preview' || command === 'sync')
          return;

        ctx.scope = config.base ?? '/';
        ctx.trailingSlash = config.trailingSlash;
        ctx.useDirectoryFormat = config.build.format === 'directory';

        let assets = config.build.assets ?? '_astro/';
        if (assets[0] === '/') assets = assets.slice(1);
        if (assets[assets.length - 1] !== '/') assets += '/';

        const { workbox = {}, ...rest } = options;
        const useWorkbox = { ...workbox };

        if (!('navigateFallback' in useWorkbox))
          useWorkbox.navigateFallback = config.base ?? '/';
        if (ctx.useDirectoryFormat)
          useWorkbox.directoryIndex = 'index.html';
        if (!('dontCacheBustURLsMatching' in useWorkbox))
          useWorkbox.dontCacheBustURLsMatching = new RegExp(assets);
        if (!useWorkbox.manifestTransforms) {
          useWorkbox.manifestTransforms = [];
          useWorkbox.manifestTransforms.push(createManifestTransform(ctx));
        }

        options.includeManifestIcons = false;

        const pwaOptions: Partial<VitePWAOptions> = {
          ...rest,
          strategies: 'generateSW',
          workbox: useWorkbox,
        };

        let plugins = VitePWA(pwaOptions);

        // Remove the built-in build plugin — we replace it with our own
        plugins = plugins.filter(p => 'name' in p && p.name !== 'vite-plugin-pwa:build');

        if (command === 'build') {
          plugins = plugins.filter(p => 'name' in p && p.name !== 'vite-plugin-pwa:dev-sw');
          plugins.push({
            name: 'nantyara-pwa:build',
            // Vite 7 Environment API: only run for client build
            applyToEnvironment(env: any) {
              return env.name === 'client';
            },
            configResolved(resolvedConfig: any) {
              if (!resolvedConfig.build.ssr)
                ctx.api = resolvedConfig.plugins
                  .flat(Infinity)
                  .find((p: any) => p.name === 'vite-plugin-pwa')?.api;
            },
            async generateBundle(_: any, bundle: any) {
              if (ctx.api) {
                ctx.api.generateBundle(bundle, this);
              }
            },
            closeBundle: {
              sequential: true,
              order: 'post' as const,
              async handler() {
                // no-op: SW generation handled in astro:build:done
              },
            },
          } as any);
        }

        updateConfig({ vite: { plugins } });
      },

      'astro:build:done': async () => {
        ctx.doBuild = true;
        if (ctx.api && !ctx.api.disabled) {
          await ctx.api.generateSW();
        }
      },
    },
  };
}
