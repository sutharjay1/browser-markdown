import { getSettings, saveSettings, type Settings } from '@/lib/settings';

const form = document.getElementById('settings-form') as HTMLFormElement;

type Field = HTMLInputElement | HTMLSelectElement;

function fields(): Field[] {
  return Array.from(form.elements).filter((el): el is Field => 'name' in el && !!(el as Field).name);
}

function load(settings: Settings): void {
  for (const field of fields()) {
    const value = settings[field.name as keyof Settings];
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      field.checked = Boolean(value);
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
