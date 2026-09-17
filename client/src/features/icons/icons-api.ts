export interface IconSummary {
  readonly id: string;
  readonly label: string | null;
  readonly url: string;
}

export const listIcons = async (): Promise<IconSummary[]> => {
  const res = await fetch('/api/icons');
  if (!res.ok) throw new Error(`Failed to list icons: ${res.statusText}`);
  return res.json() as Promise<IconSummary[]>;
};

export const uploadIcon = async (dataUrl: string, label?: string): Promise<IconSummary> => {
  const res = await fetch('/api/icons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl, ...(label !== undefined && { label }) }),
  });
  if (!res.ok) throw new Error(`Failed to upload icon: ${res.statusText}`);
  return res.json() as Promise<IconSummary>;
};
