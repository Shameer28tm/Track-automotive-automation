# Security Policy

## Reporting a vulnerability

Do not disclose secrets, personal information, or exploitable details in a public issue. Use GitHub's private vulnerability reporting feature for this repository when available.

Include the affected component, impact, reproduction steps, and a proposed mitigation if known.

## Deployment practices

- Keep API keys and connection strings out of source control.
- Use least-privilege database credentials.
- Replace placeholder credentials before enabling external integrations.
- Validate authorization for all role-specific actions.
- Use HTTPS in deployed environments.
- Review dependencies and uploaded files before production use.
