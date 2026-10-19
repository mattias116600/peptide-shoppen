// Images are stored as keys so the database never holds build-specific asset URLs:
// "bundled:<name>" points at an image shipped in src/assets, "/media/<file>" at an admin upload.
import vial from '@/assets/peptide-vial.webp';
import peptider from '@/assets/blog/peptider.webp';
import analysrapport from '@/assets/blog/analysrapport.webp';
import koncentration from '@/assets/blog/koncentration.webp';
import retatrutide from '@/assets/blog/retatrutide.webp';
import bpc157 from '@/assets/blog/bpc157.webp';
import ghkcu from '@/assets/blog/ghkcu.webp';
import motsc from '@/assets/blog/motsc.webp';
import forvaring from '@/assets/blog/forvaring.webp';
import hplc from '@/assets/blog/hplc.webp';
import tb500 from '@/assets/blog/tb500.webp';
import insulinspruta from '@/assets/insulinspruta.webp';
import insulinsprutaDetalj from '@/assets/insulinspruta-detalj.webp';

export const bundledImages: Record<string, string> = { vial, peptider, analysrapport, koncentration, retatrutide, bpc157, ghkcu, motsc, forvaring, hplc, tb500, insulinspruta, 'insulinspruta-detalj': insulinsprutaDetalj };
export const DEFAULT_PRODUCT_IMAGE = 'bundled:vial';

export function resolveImage(key: string | null | undefined): string {
  if (key?.startsWith('bundled:')) return bundledImages[key.slice(8)] ?? vial;
  if (key?.startsWith('/media/')) return key;
  return vial;
}

export const isImageKey = (key: string) => (key.startsWith('bundled:') && key.slice(8) in bundledImages) || /^\/media\/[a-z0-9]+-[a-f0-9]{12}\.(webp|png|jpg)$/.test(key);
