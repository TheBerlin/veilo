// site.mjs: where the website lives, for links from the docs to the playground and the gallery.
// The docs are a separate site, so these are absolute. veilo-ui.dev is the planned domain and is not
// confirmed yet; set VEILO_SITE_URL when building to point somewhere else.

/** The website's address, without a trailing slash. */
export const SITE_URL = process.env.VEILO_SITE_URL ?? "https://veilo-ui.dev";

/** The playground page. */
export const PLAYGROUND_URL = `${SITE_URL}/playground`;

/** The gallery page. */
export const GALLERY_URL = `${SITE_URL}/gallery`;
