import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Cross } from 'lucide-react';
import { GLOSSARY, type GlossaryTerm } from '../data/glossary';
import './ScholarDefinition.css';

const PANEL_WIDTH = 288;
const VIEWPORT_MARGIN = 12;
const GAP = 10;
const MIN_SPACE_ABOVE = 180;
const CLOSE_DELAY_MS = 120;

type Coords = { top: number; left: number; placement: 'top' | 'bottom' };

/**
 * Hover, focus, or tap a highlighted word anywhere on the site to get a short definition,
 * with a "Learn more" that expands a deeper explanation and links to its source.
 *
 * Adapted from Quantum Lab's QuantumDefinition (github.com/Lumina-Marcy/Quantum-Lab):
 * same placement rules, close delay, portal, and animation. Changes for this site:
 *   - Colors come from CSS variables, so each page's saint palette applies.
 *   - Tapping opens the panel and tapping elsewhere closes it, because some phone
 *     browsers never fire focus when you tap text.
 *   - Escape closes it, and reduced-motion users get a plain fade.
 *   - The expanded section ends with a link to the entry's source.
 *
 * The panel is portaled to document.body for the same reason as in Quantum Lab: an ancestor
 * with a transform (any Framer Motion wrapper) would otherwise trap the fixed-position panel.
 */
// Pass children for the wording in your sentence ("the tabernacle"); without them the
// glossary's capitalized term is shown, which suits headings and the start of sentences.
export default function ScholarDefinition({ term, children }: { term: GlossaryTerm; children?: ReactNode }) {
  const entry = GLOSSARY[term];
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function closeNow() {
    cancelClose();
    setOpen(false);
    setExpanded(false);
  }

  function scheduleClose() {
    cancelClose();
    closeTimeoutRef.current = setTimeout(closeNow, CLOSE_DELAY_MS);
  }

  function computeCoords() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const placement = rect.top >= MIN_SPACE_ABOVE ? 'top' : 'bottom';
    const idealLeft = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
    const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
    const left = Math.min(Math.max(idealLeft, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, maxLeft));
    const top = placement === 'top' ? rect.top - GAP : rect.bottom + GAP;
    setCoords({ top, left, placement });
  }

  function handleOpen() {
    cancelClose();
    computeCoords();
    setOpen(true);
  }

  function handleBlur(e: React.FocusEvent) {
    const next = e.relatedTarget as Node | null;
    if (next && (triggerRef.current?.contains(next) || panelRef.current?.contains(next))) return;
    closeNow();
  }

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => computeCoords();
    // Tap-away to close: the trigger and panel are the only places a tap keeps it open.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closeNow();
    };
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
      document.removeEventListener('pointerdown', onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!entry) return <>{children ?? null}</>;

  const Icon = entry.icon ?? Cross;
  const panelId = `sdef-${term}`;
  const nudge = reduceMotion ? 0 : coords?.placement === 'top' ? 6 : -6;
  const shrink = reduceMotion ? 1 : 0.96;

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      role="button"
      aria-expanded={open}
      aria-describedby={open ? panelId : undefined}
      className="sdef-trigger"
      onMouseEnter={handleOpen}
      onMouseLeave={scheduleClose}
      onFocus={handleOpen}
      onClick={handleOpen}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeNow();
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      {children ?? entry.term}

      {coords &&
        createPortal(
          <span
            ref={panelRef}
            aria-hidden={!open}
            className="sdef-anchor"
            style={{
              top: coords.top,
              left: coords.left,
              width: PANEL_WIDTH,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <AnimatePresence>
              {open && (
                <motion.span
                  id={panelId}
                  role="tooltip"
                  initial={{ opacity: 0, scale: shrink, y: nudge }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: shrink, y: nudge }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="sdef-panel"
                  onKeyDown={(e) => e.key === 'Escape' && closeNow()}
                >
                  <span className="sdef-head">
                    <Icon className="sdef-icon" strokeWidth={1.5} aria-hidden="true" />
                    <span className="sdef-term">{entry.term}</span>
                  </span>
                  <span className="sdef-definition">{entry.definition}</span>

                  {entry.moreInfo && (
                    <>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpanded((v) => !v)}
                        className="sdef-more-toggle"
                      >
                        {expanded ? 'Show less' : 'Learn more'}
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                            className="sdef-more"
                          >
                            {entry.moreInfo}
                            {'url' in entry && entry.url && (
                              <a href={entry.url} target="_blank" rel="noopener noreferrer" className="sdef-source">
                                {('sourceLabel' in entry && entry.sourceLabel) || 'Read the source'}
                                <span className="sdef-visually-hidden"> (opens in a new tab)</span>
                              </a>
                            )}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </span>,
          document.body
        )}
    </span>
  );
}
