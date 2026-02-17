# How to Check Your GitHub Copilot Pro Premium Request Usage via API

This guide explains how individual Copilot Pro users can programmatically check their premium request usage using GitHub's REST API.

---

## 1. Authentication

You need a **Personal Access Token (PAT)** with the following permission:
- **Plan (required)** (under the Account tab)
- **Interaction Limits (optional)** (also under the Account tab)

Create your PAT here:
https://github.com/settings/personal-access-tokens/new

How to create your PAT:
1. Visit the link above and log in if prompted.
2. Under **Permissions**, click the **Account** tab.
3. Click **Add permissions** and select **Plan (required)**. Optionally add **Interaction Limits**.
4. Complete the form, generate your token, and store it securely.
5. Set it as an environment variable (example in bash):
   ```bash
   export GITHUB_PAT=your_token_here
   ```

You can now use this token directly in API requests. You do not need GitHub CLI authentication for this workflow.

---

## 2. API Endpoint

Endpoint:
```text
GET https://api.github.com/users/{username}/settings/billing/premium_request/usage
```

- Replace `{username}` with your GitHub username.
- Only the past 24 months are accessible.

Default period behavior:
- If you call the endpoint without `year/month/day`, GitHub returns usage for the current month and current year.

Allowed query parameters:
- `year` (integer): return results for one year (for example `2026`)
- `month` (integer): return results for one month (`1`-`12`)
- `day` (integer): return results for one day (`1`-`31`)
- `model` (string): model filter (for example `GPT-4`)
- `product` (string): product filter (for example `Copilot`)

See official details: [GitHub API docs](https://docs.github.com/en/rest/billing/usage?apiVersion=2022-11-28#get-billing-premium-request-usage-report-for-a-user--parameters).

---

## 3. Example cURL

```bash
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_PAT" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/users/YOUR_USERNAME/settings/billing/premium_request/usage"
```

Replace `YOUR_USERNAME` with your GitHub username. `$GITHUB_PAT` should contain your PAT.

---

## 4. Understanding the Response

The response contains an array of `usageItems` with fields:
- `grossQuantity`: total premium requests
- `discountQuantity`: included requests consumed
- `netQuantity`: billed overage requests

For Copilot Pro:
- Included used requests = `sum(discountQuantity)`
- Monthly included limit = `300` (unless your app config overrides this)

---

## 5. References
- [GitHub Billing Usage API Docs](https://docs.github.com/en/rest/billing/usage?apiVersion=2022-11-28)
- [Automating Usage Reporting](https://docs.github.com/en/billing/managing-your-billing/automating-usage-reporting)
- [Copilot Individual Plans](https://docs.github.com/en/copilot/concepts/billing/individual-plans)

---

Last updated: February 2026