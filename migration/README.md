# Preserved migration history

The working game source is in the repository root and `dist/`. No assembly is needed to run it.

The two bundle parts preserve the complete original Git history, including prepared commit `17de8db150551895ec4d5c37a8a8e1cfe9caa028`. They are split only to fit the upload transport limit. The GitHub main branch retains the repository's original initial commit and adds the migration; the older Sites history is preserved in this bundle rather than rewritten into GitHub ancestry.

To recover that history with Python 3 and Git, run from the repository root:

```sh
python -c "from pathlib import Path; Path('arena-mortis-history.bundle').write_bytes(b''.join(Path('migration/arena-mortis-history.bundle.part'+str(i)).read_bytes() for i in (1,2)))"
git bundle verify arena-mortis-history.bundle
git fetch ./arena-mortis-history.bundle refs/heads/migration/github-preservation:refs/heads/preserved-sites-history
```

The recovered branch ends at the exact prepared commit above. `INITIAL_GITHUB_README.md` preserves the original GitHub README verbatim. The existing `.gitattributes` was retained unchanged. No force-push or deployment was performed.
