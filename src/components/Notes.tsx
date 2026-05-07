import { Circle, Ghost, type LucideIcon, X } from "lucide-react";
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

function BlankNote() {
  return null;
}

function OutlineCircleBackground() {
  return <Circle className="text-beat-empty" size="80%" strokeWidth={1} />;
}

function FilledCircleBackground() {
  return (
    <Circle
      className="text-beat-empty"
      size="80%"
      strokeWidth={1}
      fill="hsl(var(--beat-empty))"
    />
  );
}

export class Note<T> {
  readonly id: string;
  readonly Component: React.FC<T & BaseNoteProps>;
  readonly props?: T;
  readonly BackgroundComponent?: React.FC<BaseNoteProps>;
  readonly name: string;

  constructor({
    id,
    name,
    Component,
    props,
    BackgroundComponent,
  }: {
    id: string;
    name: string;
    Component: React.FC<T & BaseNoteProps>;
    props?: T;
    BackgroundComponent?: React.FC<BaseNoteProps>;
  }) {
    this.id = id;
    this.name = name;
    this.Component = Component;
    this.props = props;
    this.BackgroundComponent = BackgroundComponent;
  }
}

const ICON_MAP: Record<string, LucideIcon> = {
  ghost: Ghost,
  x: X,
};

const iconNotes = Object.fromEntries(
  Object.entries(ICON_MAP).map(([key, Icon]) => [
    key,
    new Note({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
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
      name: `Note ${i}`,
      Component: RadialGlyph,
      BackgroundComponent: OutlineCircleBackground,
      props: {
        size: 94,
        fluid: true,
      },
    }),
);

export const getNotes = (settings: Settings): Record<string, Note<any>> => {
  return {
    ...iconNotes,
    lslap: new Note({
      id: "lslap",
      name: "Left Slap",
      Component: ArcNote,
      BackgroundComponent: OutlineCircleBackground,
      props: { side: "left" as const, fluid: true },
    }),
    rslap: new Note({
      id: "rslap",
      name: "Right Slap",
      Component: ArcNote,
      BackgroundComponent: OutlineCircleBackground,
      props: { side: "right" as const, fluid: true },
    }),
    ...Object.fromEntries(
      positionNotes
        .slice(0, settings.panscriptFields + 1)
        .map((note, index) => [index.toString(), note]),
    ),
    mute: new Note({
      id: "mute",
      name: "Mute",
      Component: BlankNote,
      BackgroundComponent: FilledCircleBackground,
    }),
  };
};
