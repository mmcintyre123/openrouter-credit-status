import socket

from backend import create_app


def get_preferred_lan_ip():
    # Ask the OS which interface it would use for outbound traffic so we can
    # print a likely LAN URL without hard-coding a private IP address.
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            lan_ip = sock.getsockname()[0]
    except OSError:
        lan_ip = None

    if lan_ip and not lan_ip.startswith(("127.", "169.254.")):
        return lan_ip

    # Fall back to hostname resolution if the socket probe cannot determine a
    # usable LAN address.
    try:
        for ip_address in socket.gethostbyname_ex(socket.gethostname())[2]:
            if not ip_address.startswith(("127.", "169.254.")):
                return ip_address
    except OSError:
        return None

    return None


if __name__ == "__main__":
    app = create_app()
    lan_ip = get_preferred_lan_ip()

    # Bind on all interfaces so the app is reachable from this machine and
    # other devices on the same LAN.
    print("Starting Usage Dashboard API server on http://0.0.0.0:4000")
    print("Local URL: http://localhost:4000")
    if lan_ip:
        print(f"LAN URL: http://{lan_ip}:4000")
    print("Endpoint: /api/openrouter/balance")
    print("Endpoint: /api/github/copilot/premium-usage")
    print("Endpoint: /api/openai/codex/limits")
    app.run(host="0.0.0.0", port=4000, debug=True, use_reloader=False)
