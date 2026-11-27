// ===== App version (single source of truth) =====
// Android build reads this file too (versionName / versionCode), and js/update.js compares it with Firebase system/version.
//   "14"    = OB (major) version   -> next OB would be "15"     => mandatory update, no "Later"
//   "14.1"  = patch version        -> next patches "14.2" ...   => update with "Later" option
// Change this number (and add a note in README.md) every time you publish a new APK.
const APP_VERSION='14';
