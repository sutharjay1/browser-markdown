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
      next[field.name] = Number(field.value);
    } else {
      next[field.name] = field.value;
    }
  }
  await saveSettings(next as unknown as Settings);
}

void getSettings().then(load);
form.addEventListener('change', () => void persist());
