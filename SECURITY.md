# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **[your-email@example.com]**. You will receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

### What to Include

When reporting a security vulnerability, please include:

1. **Description**: A clear description of the vulnerability
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Impact**: Potential impact of the vulnerability
4. **Suggested Fix**: If you have ideas on how to fix it
5. **Proof of Concept**: If applicable, include a proof of concept

### What We'll Do

1. Acknowledge receipt of your report within 48 hours
2. Investigate the vulnerability
3. Provide an estimated timeline for a fix
4. Notify you when the vulnerability is fixed
5. Credit you in the security advisory (if you wish)

## Security Best Practices

### For Users

- Always use the latest version of the application
- Keep your dependencies up to date
- Never upload sensitive or personal information in videos
- Use HTTPS when deploying the application
- Regularly review and rotate API keys and secrets

### For Developers

- Follow secure coding practices
- Regularly update dependencies
- Use environment variables for sensitive configuration
- Implement proper input validation
- Use rate limiting to prevent abuse
- Keep security dependencies updated

## Known Security Considerations

### File Upload

- File size limits are enforced (1GB default)
- File type validation is performed
- Uploaded files are stored in a secure location
- Processed files are cleaned up after a period

### API Security

- Rate limiting is implemented
- CORS is configured appropriately
- Input validation using Zod schemas
- Error messages don't expose sensitive information

### Dependencies

We regularly update dependencies to address security vulnerabilities. Check our Dependabot alerts for the latest information.

## Disclosure Policy

- We follow responsible disclosure practices
- Security vulnerabilities will be disclosed after a patch is available
- Credit will be given to reporters (if they wish)
- We will not take legal action against security researchers who act in good faith

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in release notes.

## Contact

For security-related questions or concerns, please contact: **[your-email@example.com]**
