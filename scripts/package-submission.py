"""Create a reviewable source ZIP, excluding secrets, dependencies and build output."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
output = root / 'nagaed-submission.zip'
excluded = {'.git', '.venv', 'node_modules', '__pycache__', '.pytest_cache', '.ruff_cache', 'dist', 'tmp', '.codex', '.agents', '.aws'}
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if not path.is_file() or any(part in excluded for part in relative.parts):
            continue
        if path.name == '.env' or path.name.endswith('.zip') or (path.name.startswith('.env.') and path.name != '.env.example'):
            continue
        archive.write(path, relative)
with ZipFile(output) as archive:
    names = archive.namelist()
    assert 'README.md' in names and 'architecture.png' in names
    assert not any(Path(name).name == '.env' for name in names)
print(output)
