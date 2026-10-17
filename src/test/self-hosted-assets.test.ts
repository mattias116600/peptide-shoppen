import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

describe('Self-hosted presentation assets', () => {
  it('includes all 13 WebP images in the project', () => {
    const images = ['nordic-lab-hero', 'peptide-vial', 'peptides-hero',
      ...['analysrapport', 'bpc157', 'forvaring', 'ghkcu', 'hplc', 'koncentration', 'motsc', 'peptider', 'retatrutide', 'tb500'].map(name => `blog/${name}`)];
    expect(images).toHaveLength(13);
    for (const image of images) {
      const path = resolve(root, `src/assets/${image}.webp`);
      expect(existsSync(path), image).toBe(true);
      expect(readFileSync(path).subarray(0, 4).toString()).toBe('RIFF');
    }
  });

  it('does not import hosted asset pointers in application source', () => {
    function check(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = resolve(dir, entry.name);
        if (entry.isDirectory()) check(path);
        else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) {
          expect(readFileSync(path, 'utf8'), path).not.toMatch(/\.asset\.json|\/__l5e\/assets-v1\//);
        }
      }
    }
    check(resolve(root, 'src'));
  });

  it('serves both brand fonts locally with all referenced files included', () => {
    const css = readFileSync(resolve(root, 'public/fonts/fonts.css'), 'utf8');
    expect(css).toContain("font-family: 'Archivo'");
    expect(css).toContain("font-family: 'DM Sans'");
    const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]);
    expect(urls).toHaveLength(5);
    for (const url of urls) {
      expect(url).toMatch(/^\/fonts\/[^/]+\.woff2$/);
      expect(readFileSync(resolve(root, `public${url}`)).subarray(0, 4).toString()).toBe('wOF2');
    }
    const layout = readFileSync(resolve(root, 'src/routes/__root.tsx'), 'utf8');
    expect(layout).toContain('href: "/fonts/fonts.css"');
    expect(layout).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });
});