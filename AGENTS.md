<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep storefront navigation, search, and the session-only cart in the root StoreProvider layout so browsing between routes preserves cart state without pretending orders are persisted.
- Keep sample catalog data and cart calculations in the browser-safe product module; no checkout or verified batch claims until actual commerce services and documentation are supplied.
- Define storefront visual styles and semantic color tokens in src/styles.css so shared routes remain visually consistent.
