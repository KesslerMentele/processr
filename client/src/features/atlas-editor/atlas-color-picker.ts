import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { RangeSetBuilder, StateField } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';

/** Matches: color "#RRGGBB" (or 3/4/8-digit hex variants) */
const COLOR_PATTERN = /\bcolor\s+"(#[\da-fA-F]{3,8})"/g;

/** A small colored square that opens the native color picker on click. */
class ColorSwatchWidget extends WidgetType {
  hex: string; hexFrom: number; hexTo: number;
  constructor(hex: string, hexFrom: number, hexTo: number) {
    super();
    this.hex = hex; this.hexFrom = hexFrom; this.hexTo = hexTo;
  }

  eq(other: ColorSwatchWidget): boolean {
    return other.hex === this.hex && other.hexFrom === this.hexFrom;
  }

  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement('span');
    el.className = 'cm-atlas-color-swatch';
    el.style.cssText = `background:${this.hex}`;
    el.title = this.hex;

    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'color';
      // Native <input type="color"> only accepts 6-digit hex (#RRGGBB).
      // Expand shorthand (#RGB → #RRGGBB) and strip alpha if present.
      input.value = this.hex.length === 4
        ? `#${this.hex[1]}${this.hex[1]}${this.hex[2]}${this.hex[2]}${this.hex[3]}${this.hex[3]}`
        : this.hex.slice(0, 7);
      input.style.cssText = 'position:fixed;opacity:0;width:0;height:0;pointer-events:none';
      document.body.appendChild(input);

      input.addEventListener('input', () => {
        view.dispatch({ changes: { from: this.hexFrom, to: this.hexTo, insert: input.value } });
      });
      input.addEventListener('blur', () => { document.body.removeChild(input); });
      input.click();
    });

    return el;
  }
}

const buildDecorations = (state: EditorState): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  const text = state.doc.toString();

  Array.from(text.matchAll(COLOR_PATTERN)).forEach((m) => {
    const base = m.index;
    const hexStart = base + m[0].indexOf(m[1]);
    const hexEnd = hexStart + m[1].length;
    const swatchPos = base + m[0].indexOf('"'); // just before the opening quote

    builder.add(
      swatchPos, swatchPos,
      Decoration.widget({ widget: new ColorSwatchWidget(m[1], hexStart, hexEnd), side: -1 }),
    );
  });

  return builder.finish();
};

export const atlasColorPicker = StateField.define<DecorationSet>({
  create: (state) => buildDecorations(state),
  update: (decos, tr) => tr.docChanged ? buildDecorations(tr.state) : decos.map(tr.changes),
  provide: (f) => EditorView.decorations.from(f),
});