import subprocess, os
from google.adk.tools import FunctionTool

def git_status() -> str:
    """Get current git status."""
    result = subprocess.run(
        "git status --short", shell=True,
        cwd=os.getenv("PROJECT_ROOT", "."),
        capture_output=True, text=True
    )
    return result.stdout

def git_diff(file_path: str = "") -> str:
    """Get git diff for a file or all changes."""
    result = subprocess.run(
        f"git diff {file_path}", shell=True,
        cwd=os.getenv("PROJECT_ROOT", "."),
        capture_output=True, text=True
    )
    return result.stdout[:5000]

def git_log(n: int = 10) -> str:
    """Get last N git commits."""
    result = subprocess.run(
        f"git log --oneline -{n}", shell=True,
        cwd=os.getenv("PROJECT_ROOT", "."),
        capture_output=True, text=True
    )
    return result.stdout

git_status_tool = FunctionTool(git_status)
git_diff_tool = FunctionTool(git_diff)
git_log_tool = FunctionTool(git_log)
