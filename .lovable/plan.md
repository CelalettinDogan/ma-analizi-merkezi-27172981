

# Premium Bottom Nav & Badge Redesign

## File 1: `src/components/navigation/BottomNav.tsx`

### Icon consistency
- Replace mixed icon styles with visually balanced set: `Home`, `Radio` (instead of `Zap`), `Sparkles` (instead of `Bot`), `BarChart3` (instead of `Trophy`), `Crown`, `User`
- Set `strokeWidth={1.75}` on all icons for uniform weight
- Keep `w-[22px] h-[22px]` for consistent optical size

### Active state — filled feel + scale
- Active icon: add `fill="currentColor"` + `opacity-20` fill to simulate filled state without needing separate icon set
- Wrap icon+label in `motion.div` with `animate={{ scale: isActive ? 1.05 : 1 }}` (150ms ease-out)
- Keep `bg-primary/8` pill background for active tab
- Transition: `duration-150` ease-out

### Label & spacing
- Keep `text-[10px]`, `whitespace-nowrap`, `font-medium`
- Gap between icon and label: `gap-1`

## File 2: `src/components/TodaysMatches.tsx` (lines 195-209)

### "Büyük Maç" badge — premium chip
- Background: `bg-muted/40` instead of `bg-secondary/8` — neutral, not orange
- Text: `text-foreground/70` instead of `text-secondary` — subtle, not colored
- Icon: `Sparkles` at `w-3 h-3` with `text-foreground/50`
- Font weight stays `font-medium`
- Border: none (flat chip)
- Radius: `rounded-md` (6px) instead of `rounded-lg` — less bubbly, more systematic
- Same approach for other badge variants (`En Yakın`, `Önerilen`): all use `bg-muted/40 text-foreground/70`

Result: unified neutral chips that don't scream, just inform.

