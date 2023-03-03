import path from 'path'
import { normalizePath } from 'vite'

import {
  KNOWN_CSS_EXTENSIONS,
  CLIENT_REACT_REFRESH_PATH,
  KNOWN_JSX_EXTENSIONS,
  CLIENT_SCRIPT_PATH
} from '../constants'

export const disableThemeCheckTag = '{% # theme-check-disable %}\n'
export const adastraTagDisclaimer =
  '{% comment %}\n  IMPORTANT: This snippet is automatically generated by Vite.\n  Do not attempt to modify this file directly, as any changes will be overwritten by the next build.\n{% endcomment %}\n'

// Generate liquid variable with resolved path by replacing aliases
export const adastraTagEntryPath = (
  resolveAlias: { find: string | RegExp; replacement: string }[],
  entrypointsDir: string,
  snippetName: string
): string => {
  const replacements: [string, string][] = []

  resolveAlias.forEach(alias => {
    if (typeof alias.find === 'string') {
      replacements.push([
        alias.find,
        normalizePath(path.relative(entrypointsDir, alias.replacement))
      ])
    }
  })

  return `{% assign path = ${snippetName} | ${replacements
    .map(([from, to]) => `replace: '${from}/', '${to}/'`)
    .join(' | ')} %}\n`
}

// Generate conditional statement for entry tag
export const adastraEntryTag = (
  entryPaths: string[],
  tag: string,
  isFirstEntry = false
): string =>
  `{% ${!isFirstEntry ? 'els' : ''}if ${entryPaths
    .map(entryName => `path == "${entryName}"`)
    .join(' or ')} %}\n  ${tag}`

// Generate a preload link tag for a script or style asset
export const preloadScriptTag = (fileName: string): string =>
  `<link rel="modulepreload" href="{{ '${fileName}' | asset_url | split: '?' | first }}" crossorigin="anonymous">`

// Generate a production script tag for a script asset
export const scriptTag = (fileName: string): string =>
  `<script src="{{ '${fileName}' | asset_url | split: '?' | first }}" type="module" crossorigin="anonymous"></script>`

// Generate a production stylesheet link tag for a style asset
export const stylesheetTag = (fileName: string): string =>
  `{{ '${fileName}' | asset_url | split: '?' | first | stylesheet_tag: preload: preload }}`

// Generate adastra tag snippet for development
export const adastraTagSnippetDev = (
  assetHost: string,
  entrypointsDir: string
): string =>
  `{% liquid
  assign path_prefix = path | slice: 0
  if path_prefix == '/'
    assign file_url_prefix = '${assetHost}'
  else
    assign file_url_prefix = '${assetHost}/${entrypointsDir}/'
  endif

  assign file_url = path | prepend: file_url_prefix
  assign file_name = path | split: '/' | last
  if file_name contains '.'
    assign file_extension = file_name | split: '.' | last
  endif

  assign css_extensions = '${KNOWN_CSS_EXTENSIONS.join('|')}' | split: '|'
  assign jsx_extensions = '${KNOWN_JSX_EXTENSIONS.join('|')}' | split: '|'
  assign is_css = false
  assign is_jsx = false

  if css_extensions contains file_extension
    assign is_css = true
  endif

  if jsx_extensions contains file_extension
    assign is_jsx = true
  endif

  if file_extension == blank
    assign file_url = file_url | append: '/' | append: file_name
  endif
%}

{% if is_jsx %}
  <script type="module">
    import RefreshRuntime from "${assetHost}/${CLIENT_REACT_REFRESH_PATH}"
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
{% endif %}

<script src="${assetHost}/${CLIENT_SCRIPT_PATH}" type="module"></script>

{% if is_css %}
  {{ file_url | stylesheet_tag }}
{% else %}
  <script src="{{ file_url }}" type="module" crossorigin="anonymous"></script>
{% endif %}
`
