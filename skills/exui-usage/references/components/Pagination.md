# Pagination

## Import

```tsx
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `Pagination`
- `PaginationContent`
- `PaginationEllipsis`
- `PaginationItem`
- `PaginationLink`
- `PaginationNext`
- `PaginationPrevious`

## Usage

```tsx
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@exre/exui"
import "@exre/exui/style.css"

export function TablePagination({ page }: { page: number }) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={`?page=${page - 1}`} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={`?page=${page - 1}`}>{page - 1}</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={`?page=${page}`} isActive>
            {page}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={`?page=${page + 1}`}>{page + 1}</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href={`?page=${page + 1}`} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

`PaginationLink` marks the current page with `isActive` and accepts `size`; `PaginationPrevious`/`PaginationNext` render labeled chevron links (their visible text is `text`-able). The links render anchors — adapt them to your router with `asChild`, or drive them with `onClick` handlers and controlled page state instead of `href`.

For advanced props, use the TypeScript types exposed by the package-root import.
