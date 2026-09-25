# BoardLK development commit record

This replaces the earlier uncommitted 12-group plan. The base is `21ee6c7` (`Backend created`). The following 14 additional local commits cover the completed development pass. No push is performed; sync them to GitHub after review.

1. `fix(config): validate deployment origins and JWT expiry`
2. `feat(health): add database readiness and process liveness probes`
3. `fix(models): enforce property capacity and rating invariants`
4. `fix(search): validate filter enums and numeric query values`
5. `fix(api): reject ambiguous and out-of-range pagination`
6. `fix(favorites): serialize saves with property lifecycle changes`
7. `fix(media): retain cleanup jobs and safely replace profile photos`
8. `perf(messages): aggregate conversation unread counts`
9. `feat(notifications): support validated unread and type filters`
10. `fix(dates): use Sri Lankan calendar dates for booking validation`
11. `feat(setup): generate a private local JWT secret safely`
12. `feat(frontend): open the browser automatically with npm start`
13. `test(backend): cover concurrency readiness and validation regressions`
14. `docs: document backend operation and verified release checks`

See [VALIDATION.md](VALIDATION.md) for executed checks and external configuration requirements. The machine-readable file groups are in `commit-plan.json`. These groups describe the changes already committed; do not rerun them to create duplicate commits.
