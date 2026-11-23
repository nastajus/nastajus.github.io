import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'compact', width: 390, height: 844 },
  { name: 'tall', width: 430, height: 932 }
];
const fontScales = [1, 1.5];
const scenes = ['operations', 'meta', 'scientific'];

for (const viewport of viewports) {
  for (const fontScale of fontScales) {
    for (const sceneId of scenes) {
      test(`${sceneId} stays readable at ${viewport.name} and ${fontScale}x text`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.addStyleTag({
          content: `
            html { font-size: ${16 * fontScale}px !important; scroll-behavior: auto !important; }
            *, *::before, *::after { animation: none !important; transition: none !important; }
          `
        });
        const scene = page.locator(`#${sceneId}`);
        for (const frameIndex of [0, 1, 2, 3]) {
          await test.step(`frame ${frameIndex + 1}`, async () => {
            await page.evaluate(({ id, frame }) => {
              const scene = document.getElementById(id);
              const travel = Math.max(1, scene.offsetHeight - innerHeight);
              const progress = (frame + 0.18) / 4;
              scrollTo(0, scene.offsetTop + travel * progress);
              dispatchEvent(new Event('resize'));
            }, { id: sceneId, frame: frameIndex });

            await expect(scene).toHaveClass(/is-gallery-focused/);
            await expect(scene.locator('[data-scene-jump].is-current')).toHaveAttribute('data-scene-jump', String(frameIndex));
            const activeImage = scene.locator('.gallery-image.is-active');
            await expect(activeImage).toBeVisible();
            await expect.poll(() => activeImage.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);

            const layout = await scene.evaluate((element) => {
              const feature = element.querySelector('.mobile-feature-copy');
              const kicker = element.querySelector('.scene-kicker');
              const gallery = element.querySelector('.project-gallery');
              const image = element.querySelector('.gallery-image.is-active');
              const caption = element.querySelector('.gallery-caption');
              const featureRect = feature.getBoundingClientRect();
              const kickerRect = kicker.getBoundingClientRect();
              const galleryRect = gallery.getBoundingClientRect();
              const imageRect = image.getBoundingClientRect();
              const captionRect = caption.getBoundingClientRect();
              return {
                viewportWidth: innerWidth,
                viewportHeight: innerHeight,
                documentWidth: document.documentElement.scrollWidth,
                featureBottom: featureRect.bottom,
                featureTop: featureRect.top,
                featureOverflow: feature.scrollWidth - feature.clientWidth,
                kickerBottom: kickerRect.bottom,
                galleryTop: galleryRect.top,
                galleryBottom: galleryRect.bottom,
                galleryLeft: galleryRect.left,
                galleryRight: galleryRect.right,
                galleryHeight: galleryRect.height,
                imageLeft: imageRect.left,
                imageRight: imageRect.right,
                imageHeight: imageRect.height,
                imageNaturalWidth: image.naturalWidth,
                captionTop: captionRect.top,
                captionBottom: captionRect.bottom,
                objectFit: getComputedStyle(image).objectFit
              };
            });

            expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
            expect(layout.featureOverflow).toBeLessThanOrEqual(1);
            expect(layout.kickerBottom).toBeLessThanOrEqual(layout.featureTop + 1);
            expect(layout.featureBottom).toBeLessThanOrEqual(layout.galleryTop + 1);
            expect(layout.galleryTop).toBeGreaterThanOrEqual(0);
            expect(layout.galleryBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
            expect(layout.galleryHeight).toBeGreaterThanOrEqual(180);
            expect(layout.galleryLeft).toBeLessThanOrEqual(1);
            expect(layout.galleryRight).toBeGreaterThanOrEqual(layout.viewportWidth - 1);
            expect(layout.imageLeft).toBeLessThanOrEqual(1);
            expect(layout.imageRight).toBeGreaterThanOrEqual(layout.viewportWidth - 1);
            expect(layout.imageHeight).toBeGreaterThanOrEqual(130);
            expect(layout.imageNaturalWidth).toBeGreaterThan(0);
            expect(layout.captionTop).toBeGreaterThanOrEqual(0);
            expect(layout.captionBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
            expect(layout.objectFit).toBe('contain');
          });
        }
      });
    }
  }
}
