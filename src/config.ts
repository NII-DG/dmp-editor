// Get the development environment flag from the environment variable
const USE_GRDM_DEV_ENV = import.meta.env.VITE_USE_GRDM_DEV_ENV === "true"

/**
 * GakuNin RDM environment settings
 * Switch between production and development environments with the environment variable VITE_USE_GRDM_DEV_ENV
 */
export const GRDM_CONFIG = {
  /**
   * Base URL of the GakuNin RDM Web UI
   */
  BASE_URL: USE_GRDM_DEV_ENV
    ? "https://rcos.rdm.nii.ac.jp"
    : "https://rdm.nii.ac.jp",

  /**
   * Base URL of the GakuNin RDM API
   */
  API_BASE_URL: USE_GRDM_DEV_ENV
    ? "https://api.rcos.rdm.nii.ac.jp/v2"
    : "https://api.rdm.nii.ac.jp/v2",

  /**
   * URL of the token setting page of GakuNin RDM
   */
  TOKEN_SETTINGS_URL: USE_GRDM_DEV_ENV
    ? "https://rcos.rdm.nii.ac.jp/settings/tokens"
    : "https://rdm.nii.ac.jp/settings/tokens",

  /**
   * URL of the support page for token setting
   */
  SUPPORT_URL: "https://support.rdm.nii.ac.jp/usermanual/Setting-06/",
} as const
