import { Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InfoDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
        title="About & usage"
        aria-label="About and usage instructions"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl h-[100dvh] sm:h-[90vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 sm:rounded-lg rounded-none">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border shrink-0">
            <DialogTitle>How to use Note8</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 text-sm text-foreground space-y-5 leading-relaxed">
            <section>
              <h3 className="font-semibold text-base mb-1.5">
                Getting started
              </h3>
              <p className="text-muted-foreground">
                Note8 is a handpan composition tool. A composition is a sequence
                of <strong>bars</strong>, each containing <strong>beats</strong>
                . Bars wrap into <strong>rows</strong> for readability.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1.5">Adding notes</h3>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Tap a beat cell to select it.</li>
                <li>Use the position keyboard at the bottom to add notes.</li>
                <li>
                  Switch hand tabs (R / L / A / N) to assign which hand plays
                  the note. Selection auto-advances after the first note in an
                  empty cell.
                </li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1.5">Bar controls</h3>
              <p className="text-muted-foreground mb-1.5">
                Each bar has a thin accent strip below it. Tap the strip to open
                controls for that bar:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Add a bar before or after</li>
                <li>Lengthen or shorten the bar</li>
                <li>Insert a row break before the bar</li>
                <li>Delete the bar</li>
              </ul>
              <p className="text-muted-foreground mt-1.5">
                Tap anywhere outside to dismiss the controls.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1.5">Row controls</h3>
              <p className="text-muted-foreground">
                Above each row you'll find buttons to move the row up or down,
                duplicate it, or join it with the row above.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1.5">
                Saving & sharing
              </h3>
              <p className="text-muted-foreground">
                Open the menu (☰) to save compositions to your browser, load
                them back, share via URL, or export/import a JSON backup. Your
                work is also auto-saved to local storage every few seconds.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1.5">View mode</h3>
              <p className="text-muted-foreground">
                Toggle the eye icon to switch to a clean read-only view of your
                composition — handy for performing or sharing.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1.5">Settings</h3>
              <p className="text-muted-foreground">
                The gear icon opens theme, hand colors, and tone field
                configuration. Hand colors apply to both edit and view modes.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
