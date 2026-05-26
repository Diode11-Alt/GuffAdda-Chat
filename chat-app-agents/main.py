import asyncio
from dotenv import load_dotenv
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.types import Content, Part
from orchestrator.root_agent import root_agent
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

load_dotenv()
console = Console()

APP_NAME = "secure_chat_app_builder"
USER_ID = "developer"

async def run_agent_system():
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
    )

    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    console.print(Panel.fit(
        "[bold green]🤖 Secure Chat App — Multi-Agent System[/bold green]\n"
        "[dim]Powered by Google ADK + Gemini 2.0[/dim]",
        border_style="green"
    ))

    while True:
        user_input = console.input("\n[bold cyan]You:[/bold cyan] ").strip()
        if user_input.lower() in ("exit", "quit", "q"):
            console.print("[dim]Shutting down agents...[/dim]")
            break

        message = Content(role="user", parts=[Part(text=user_input)])

        console.print("\n[bold yellow]🤖 Agents working...[/bold yellow]")

        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session.id,
            new_message=message,
        ):
            if event.is_final_response() and event.content:
                for part in event.content.parts:
                    if part.text:
                        console.print(Panel(
                            Markdown(part.text),
                            title="[bold green]Agent Response[/bold green]",
                            border_style="green"
                        ))

if __name__ == "__main__":
    asyncio.run(run_agent_system())
