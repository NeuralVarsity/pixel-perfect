# Minimal blog-focused dashboard

## Goal
Turn the current metrics-heavy dashboard into a simple workspace for writing and managing articles, while preserving the existing dark NeuralVarsity style.

## Changes
1. **Make blogs the main focus**
   - Replace the welcome/analytics screen with a clear **Your blogs** heading and prominent **New post** action.
   - Show only four compact status totals: All posts, Drafts, Scheduled, and Published.
   - Make each total a useful shortcut to the matching post view.

2. **Put the post list front and center**
   - Show recent articles immediately below the status totals.
   - Keep the information needed for daily work: title, status, author, last update, views, and quick edit/view actions.
   - Include a direct **View all blogs** link and a clear empty state for first-time users.

3. **Remove dashboard noise**
   - Remove traffic, SEO, content-metric panels, charts, top-article panel, reader heatmap, and animated counters from this page.
   - Keep analytics available on its existing page, but not in the main workflow.

4. **Simplify navigation**
   - Reduce the visible sidebar to Dashboard, Blog Posts, Drafts, Scheduled Posts, Published Posts, Media Library, and Settings.
   - Keep the logo, global search, notifications, account menu, theme control, and New post button.
   - Apply the same smaller set to the mobile navigation.

5. **Responsive polish and verification**
   - Ensure the compact layout is easy to scan on desktop and on the current narrow preview.
   - Preserve all existing post creation, editing, publishing, permissions, and data behavior.
   - Verify the signed-in dashboard, post shortcuts, and mobile navigation end to end.

## Technical details
- Refactor `src/routes/_authenticated/dashboard.tsx` to use the existing post data and status badges without analytics calculations or chart dependencies.
- Update the navigation definition in `src/components/AppShell.tsx`; no routes or features are deleted.
- Keep route metadata complete and specific to the new blog workspace.
