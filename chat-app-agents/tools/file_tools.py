import os
from google.adk.tools import FunctionTool

PROJECT_ROOT = os.getenv("PROJECT_ROOT", ".")

def read_file(path: str) -> str:
    """Read a source file from the chat app project."""
    with open(os.path.join(PROJECT_ROOT, path)) as f:
        return f.read()

def write_file(path: str, content: str) -> str:
    """Write generated code to the chat app project."""
    full = os.path.join(PROJECT_ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    return f"✅ Written: {path}"

def list_files(directory: str = ".") -> list[str]:
    """List source files, excluding node_modules and build artifacts."""
    full = os.path.join(PROJECT_ROOT, directory)
    result = []
    SKIP = {'node_modules', '.git', '__pycache__', 'dist', 'build', '.expo'}
    for root, dirs, files in os.walk(full):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for file in files:
            result.append(os.path.relpath(os.path.join(root, file), full))
    return result

def append_to_file(path: str, content: str) -> str:
    """Append content to an existing file."""
    full = os.path.join(PROJECT_ROOT, path)
    with open(full, "a") as f:
        f.write("\n" + content)
    return f"✅ Appended to: {path}"

read_file_tool = FunctionTool(read_file)
write_file_tool = FunctionTool(write_file)
list_files_tool = FunctionTool(list_files)
append_to_file_tool = FunctionTool(append_to_file)
