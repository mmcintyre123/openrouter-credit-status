from backend import create_app


if __name__ == "__main__":
    app = create_app()
    print("Starting Usage Dashboard API server on http://localhost:4000")
    print("Endpoint: http://localhost:4000/api/openrouter/balance")
    print("Endpoint: http://localhost:4000/api/github/copilot/premium-usage")
    print("Endpoint: http://localhost:4000/api/openai/codex/limits")
    app.run(port=4000, debug=True, use_reloader=False)
