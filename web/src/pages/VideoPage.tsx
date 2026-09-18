import { useTranslation } from 'react-i18next';

/**
 * Simple page to satisfy the "Video/ekraanivideo" requirement.
 * The video file lives in /public/video/ so it is copied into /dist/ on build.
 */
export function VideoPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-semibold mb-2">{t('video.title', { defaultValue: 'Video / ekraanivideo' })}</h1>
      <p className="text-gray-600 max-w-2xl">
        {t('video.subtitle', {
          defaultValue:
            'Lühike tutvustusvideo. Soovi korral asenda see fail enda ekraanivideoga (näiteks: kuidas kaart, filtrid ja tagasiside töötavad).',
        })}
      </p>

      <div className="mt-6 bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b">
          <div className="font-medium">{t('video.playerTitle', { defaultValue: 'Estonia Trails demo' })}</div>
          <div className="text-xs text-gray-500 mt-1">/public/video/estonia-trails-demo.mp4</div>
        </div>

        <div className="p-4">
          <video
            className="w-full rounded-xl"
            controls
            preload="metadata"
            poster="/hero.jpg"
          >
            <source src="/video/estonia-trails-demo.mp4" type="video/mp4" />
            {t('video.noSupport', { defaultValue: 'Sinu brauser ei toeta video elementi.' })}
          </video>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600 max-w-2xl">
        <p className="mb-2 font-medium">{t('video.replaceTitle', { defaultValue: 'Kuidas oma videoga asendada?' })}</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>{t('video.step1', { defaultValue: 'Pane oma mp4 fail nimega estonia-trails-demo.mp4 kausta web/public/video/' })}</li>
          <li>{t('video.step2', { defaultValue: 'Tee build (web kaustas): npm run build' })}</li>
          <li>{t('video.step3', { defaultValue: 'Lae dist/ sisu cPanelis public_html alla' })}</li>
        </ol>
      </div>
    </div>
  );
}
