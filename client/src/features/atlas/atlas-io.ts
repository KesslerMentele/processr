import type { Atlas } from "../../models";

export function importAtlasFromFile(): Promise<Atlas> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    // eslint-disable-next-line functional/immutable-data
    input.type = "file";
    // eslint-disable-next-line functional/immutable-data
    input.accept = ".json";
    // eslint-disable-next-line functional/immutable-data
    input.onchange = () => {
      const file = input.files?.[0];
      if (file === undefined) { reject(new Error("No file selected")); return; }
      void file.text().then(text => { resolve(JSON.parse(text) as Atlas); });
    };
    input.click();
  });
}

export function exportAtlasToFile(atlas: Atlas): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(atlas, null, 2)], { type: "application/json" })
  );
  const a = document.createElement("a");
  // eslint-disable-next-line functional/immutable-data
  a.href = url;
  // eslint-disable-next-line functional/immutable-data
  a.download = `${atlas.name}-${atlas.version}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
