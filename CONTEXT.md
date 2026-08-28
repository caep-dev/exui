# Exre UI

Exre UI is the shared React component library for Exre-branded user interfaces. It exists so other UI applications can depend on one brand-owned component package instead of copying component code.

## Language

**Exre UI**:
The brand-owned component library published from this repository.
_Avoid_: exui app, Vite app, demo app

**Consuming UI App**:
A separate frontend project that depends on Exre UI for shared components and styling.
_Avoid_: downstream project, external app

**Source Component**:
A component kept as editable source code in this repository, especially under `packages/components/src/components/ui`.
_Avoid_: vendored widget, generated blob

**UI Component**:
A single base control or shadcn/ui source component that lives under `packages/components/src/components/ui`.
_Avoid_: complex component, business component

**Control Component**:
A composed input control that lives under `packages/components/src/components/controls`, such as a date picker, range picker, searchable select, color picker, or file upload.
_Avoid_: ui component, complex component

**Pattern Component**:
A reusable, business-agnostic interaction pattern that lives under `packages/components/src/components/patterns`, such as a command dialog, confirm dialog, data toolbar, or empty state pattern.
_Avoid_: page component, business workflow

**Layout Component**:
A page or application structure component that lives under `packages/components/src/components/layouts`, such as an app shell, page header, or split panel.
_Avoid_: ui component, pattern component

**Brand Theme**:
The shared visual token set applied through the library stylesheet and shadcn/ui CSS variables.
_Avoid_: skin, preset only

**Package Entry**:
The public import surface exposed by the package root, such as `@exre/exui` and `@exre/exui/style.css`.
_Avoid_: barrel file, index file
