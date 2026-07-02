window.APP_CONFIG = {
  // Заменить на published CSV вкладки site_export в Google Sheets.
  CSV_URL: '',
  FALLBACK_CSV_URL: 'data/site_export_sample.csv',

  // Контакт для CTA.
  CONTACT_URL: 'https://t.me/alexschteine',

  // Сколько объектов можно выбрать в клиентскую подборку.
  MAX_SHORTLIST: 5,

  // Формат фото: photos/<photoPrefix>-1.jpg, photos/<photoPrefix>-2.jpg ...
  DEFAULT_PHOTO_COUNT: 5,

  // Веса скоринга. Сумма = 1.00.
  SCORING_WEIGHTS: {
    legal: 0.25,
    roi: 0.18,
    locationLiquidity: 0.18,
    leaseExtension: 0.17,
    stageRisk: 0.12,
    paymentCashflow: 0.05,
    uniqueness: 0.05
  }
};
