import {
  Circle,
  CircleDashed,
  CircleSmall,
  Dot,
  Ghost,
  type LucideIcon,
  X,
} from "lucide-react";
import type { Hand } from "@/lib/composer-state";
import type { Settings } from "@/lib/settings";
import { ArcNote } from "./ArcNote";
import { IconNote } from "./IconNote";
import { RadialGlyph } from "./PanScriptGlyph";

export type BaseNoteProps = {
  settings: Settings;
  noteId: string;
  hand: Hand;
};

export class Note<T> {
  readonly id: string;
  readonly Component: React.FC<T & BaseNoteProps>;
  readonly props?: T;

  constructor({
    id,
    Component,
    props,
  }: {
    id: string;
    Component: React.FC<T & BaseNoteProps>;
    props?: T;
  }) {
    this.id = id;
    this.Component = Component;
    this.props = props;
  }
}

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle,
  ghost: Ghost,
  dash: CircleDashed,
  ding: CircleSmall,
  dot: Dot,
  x: X,
};

const iconNotes = Object.fromEntries(
  Object.entries(ICON_MAP).map(([key, Icon]) => [
    key,
    new Note({
      id: key,
      Component: IconNote,
      props: { Icon, size: "80%" },
    }),
  ]),
);

const positionNotes = Array.from(
  { length: 13 },
  (_, i) =>
    new Note({
      id: i.toString(),
      Component: RadialGlyph,
      props: {
        size: 94,
        fluid: true,
      },
    }),
);

export const getNotes = (settings: Settings): Record<string, Note<any>> => {
  return {
    ...iconNotes,
    ting: new Note({
      id: "ting",
      Component: IconNote,
      props: { Icon: CircleSmall, size: "48%", strokeWidth: 10 / 3 },
    }),
    arcL: new Note({
      id: "arcL",
      Component: ArcNote,
      props: { side: "left", size: 94, fluid: true },
    }),
    arcR: new Note({
      id: "arcR",
      Component: ArcNote,
      props: { side: "right", size: 94, fluid: true },
    }),
    ...Object.fromEntries(
      positionNotes
        .slice(0, settings.panscriptFields + 1)
        .map((note, index) => [index.toString(), note]),
    ),
  };
};
