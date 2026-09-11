# Calendar

## Import

```tsx
import { Calendar } from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `Calendar`
- `CalendarDayButton`

## Usage

`Calendar` wraps react-day-picker. The `mode` prop selects the selection model and decides the controlled prop types:

- `mode="single"`: `selected` is `Date | undefined` and `onSelect` receives `Date | undefined`.
- `mode="range"`: `selected` is a `DateRange` (`{ from, to }`) and `onSelect` receives the same shape; `to` is `undefined` until the user picks the second date.

### Single selection

```tsx
const [date, setDate] = React.useState<Date | undefined>(undefined)

<Calendar mode="single" selected={date} onSelect={setDate} />
```

[完整示例：单选](../../examples/calendar-single.tsx) shows the controlled value in one runnable file.

### Range selection

The range type is not re-exported through the package root. Describe the state structurally: a range is `{ from: Date | undefined; to?: Date | undefined }`.

```tsx
type DateRange = { from: Date | undefined; to?: Date | undefined }

const [range, setRange] = React.useState<DateRange | undefined>(undefined)

<Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
```

[完整示例：范围选择](../../examples/calendar-range.tsx) shows the controlled range with a two-month layout in one runnable file.

For uncontrolled use, pass `defaultSelected` instead of `selected`/`onSelect`.

## Styling and localization

`Calendar` maps ExUI Tokens onto react-day-picker's class slots, so the default look needs no extra classes. Useful props:

- `buttonVariant`: the variant used for the navigation chevrons.
- `captionLayout`: `"label"` (default) or dropdown layouts such as `"dropdown-months"`.
- `locale` and `formatters`: localization and label formatting, passed through to react-day-picker.
- `components`: custom part overrides. `CalendarDayButton` is exported for a typed `components.DayButton` override.

Disabled and hidden days use react-day-picker's `disabled` and `hidden` props.

For the full prop set, use the TypeScript types exposed by the package-root import; the react-day-picker v10 types describe them.
