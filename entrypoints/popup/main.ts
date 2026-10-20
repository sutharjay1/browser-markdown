import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@/assets/styles/tokens.css';
import { getSettings, saveSettings, type Settings } from '@/lib/settings';
import {
  missingOrigins,
  fileOptInMissing,
  requestAccess,
  usesFileSchemeToggle,
  FILE_ORIGINS,
} from '@/lib/permissions';

const form = document.getElementById('settings-form') as HTMLFormElement;

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function fields(): Field[] {
  return Array.from(form.elements).filter((el): el is Field => 'name' in el && !!(el as Field).name);
}

function load(settings: Settings): void {
  for (const field of fields()) {
    const value = settings[field.name as keyof Settings];
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else if (field instanceof HTMLTextAreaElement) {
      // Textareas carry string-array settings, one entry per line.
      field.value = Array.isArray(value) ? value.join('\n') : String(value ?? '');
    } else {
      field.value = String(value);
    }
  }
}

async function persist(): Promise<void> {
  const next: Record<string, unknown> = { ...(await getSettings()) };
  for (const field of fields()) {
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      next[field.name] = field.checked;
    } else if (field instanceof HTMLInputElement && field.type === 'number') {
      // Clamp before persisting: clearing the field yields Number('') === 0,
      // and HTML's min="500" isn't enforced on the value we read here.
      next[field.name] = Math.max(500, Number(field.value) || 1500);
    } else if (field instanceof HTMLTextAreaElement) {
      next[field.name] = field.value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    } else {
      next[field.name] = field.value;
    }
  }
  // Double-cast: Record<string, unknown> has no structural overlap with
  // Settings, but field names come from the Settings keys via load(), so the
  // runtime shape here is actually correct.
  await saveSettings(next as unknown as Settings);
}

void getSettings().then(load);
form.addEventListener('change', () => void persist());

// --- Site access -----------------------------------------------------------
// Firefox MV3 ships every host permission ungranted, so a fresh install renders
// nothing and gives no clue why. Surface it here, where the click that grants
// it is a user gesture (permissions.request() requires one).

const banner = document.getElementById('access-banner') as HTMLElement;
const bannerBody = document.getElementById('access-body') as HTMLElement;
const grantButton = document.getElementById('access-grant') as HTMLButtonElement;

// Firefox 153+ gates file:// behind its own add-on toggle that no API can flip.
const FIREFOX_FILE_HINT =
  'Open about:addons → Browser Markdown → Permissions and turn on “Access local files on your computer” to render local .md files.';

async function refreshAccess(): Promise<void> {
  const [missing, optInOff] = await Promise.all([missingOrigins(), fileOptInMissing()]);
  banner.hidden = missing.length === 0 && !optInOff;
  if (banner.hidden) return;
  if (missing.length === 0) {
    // Every grantable origin is in; only the about:addons toggle is left.
    grantButton.hidden = true;
    bannerBody.textContent = FIREFOX_FILE_HINT;
    return;
  }
  const onlyFilesMissing = missing.every((o) => FILE_ORIGINS.includes(o));
  // On Chromium, file access is a checkbox on the extension's details page —
  // permissions.request() can never satisfy it, so don't offer a dead button.
  const buttonIsUseless = onlyFilesMissing && usesFileSchemeToggle();
  grantButton.hidden = buttonIsUseless;
  bannerBody.textContent = buttonIsUseless
    ? 'Open this extension’s details page and turn on “Allow access to file URLs” to render local .md files.'
    : onlyFilesMissing
      ? 'Local file:// access isn’t granted yet, so local .md files stay unrendered.'
      : 'Access to markdown files isn’t granted yet, so pages stay unrendered.';
}

grantButton.addEventListener('click', () => {
  void (async () => {
    grantButton.disabled = true;
    const { fileAccessUnavailable } = await requestAccess(await missingOrigins());
    await refreshAccess();
    if (!banner.hidden && fileAccessUnavailable) {
      // Chrome's file access is a per-install toggle no API can flip.
      bannerBody.textContent =
        'For local files, open the extension’s details page and turn on “Allow access to file URLs”.';
      grantButton.hidden = true;
    }
    grantButton.disabled = false;
  })();
});

void refreshAccess();
