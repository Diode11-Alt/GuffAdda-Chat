import subprocess
import os
from google.adk.tools import FunctionTool

def run_command(command: str, working_dir: str = ".") -> dict:
    """
    Run a shell command in the project directory.
    Use for: npm install, npm test, npm run lint, git operations.
    Returns: { stdout, stderr, returncode }
    """
    result = subprocess.run(
        command, shell=True,
        cwd=os.path.join(os.getenv("PROJECT_ROOT", "."), working_dir),
        capture_output=True, text=True, timeout=120
    )
    return {
        "stdout": result.stdout[:3000],  # limit output size
        "stderr": result.stderr[:1000],
        "returncode": result.returncode,
        "success": result.returncode == 0
    }

def run_tests(test_path: str = "") -> dict:
    """Run the test suite and return results."""
    cmd = f"npm run test {test_path} -- --reporter=verbose"
    return run_command(cmd)

def run_lint() -> dict:
    """Run ESLint on the project."""
    return run_command("npm run lint")

def check_types() -> dict:
    """Run TypeScript type checking."""
    return run_command("npx tsc --noEmit")

run_command_tool = FunctionTool(run_command)
run_tests_tool = FunctionTool(run_tests)
run_lint_tool = FunctionTool(run_lint)
check_types_tool = FunctionTool(check_types)
