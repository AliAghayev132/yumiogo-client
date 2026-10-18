import { baseApi } from './baseApi'

/**
 * AI translation of content texts (server /api/admin/translate, OpenRouter).
 *
 *   GET  /admin/translate/status → { enabled, model }  (enabled = OPENROUTER_API_KEY is set)
 *   POST /admin/translate { from: en|az|ru, to: [lang], texts: { "<key>": string | [string] } }
 *        → { translations: { "<lang>": { "<key>": string | [string] } } }
 *        503 TRANSLATE_NOT_CONFIGURED · 502 TRANSLATE_FAILED · 400 TRANSLATE_INVALID
 *
 * Nothing is saved: the panel fills the form with the answer (see useAutoTranslate).
 */
export const adminTranslateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTranslateStatus: builder.query({
      query: () => '/admin/translate/status',
      // Only changes with the server's env; every form with a Translate button shares it.
      keepUnusedDataFor: 600,
    }),
    translateTexts: builder.mutation({
      query: (body) => ({ url: '/admin/translate', method: 'POST', body }),
    }),
  }),
})

export const { useGetTranslateStatusQuery, useTranslateTextsMutation } = adminTranslateApi
