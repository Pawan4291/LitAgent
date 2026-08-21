export interface TemplateRecord {
  id: string;
  owner: string;
  label: string;
  command: string;
  createdAt: number;
}

export async function saveTemplate(owner: string, label: string, command: string): Promise<boolean> {
  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, label, command }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function getTemplates(owner: string): Promise<TemplateRecord[]> {
  try {
    const res = await fetch(`/api/templates?owner=${owner}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}

export async function deleteTemplate(owner: string, id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, id }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}