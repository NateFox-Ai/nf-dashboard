# Client Folder Structure Template

When onboarding a new client, create a folder following this structure:

## Folder Path
```
companies/effortlessonboarding/client-work/[CLIENT-NAME]/
```

## Subfolders

### 1. brand-assets/
Client's brand materials:
- Logo files (all formats)
- Brand guide
- Color codes
- Font files
- Any existing marketing materials

### 2. discovery/
Information gathered during sales/discovery:
- Initial call notes
- Workflow documentation
- Pain points identified
- Goals and objectives
- Current tool stack

### 3. workflow-designs/
Automation planning:
- Flowcharts
- Process maps
- Integration diagrams
- Wireframes (if needed)

### 4. implementation/
Actual build files:
- n8n/Make.com exports
- Configuration files
- Code snippets
- API credentials (encrypted)

### 5. documentation/
Client deliverables:
- User guides
- Training videos
- Troubleshooting docs
- Maintenance procedures

### 6. communication/
All correspondence:
- Email threads
- Meeting notes
- Change requests
- Approval confirmations

### 7. billing/
Financial records:
- Invoices
- Payment confirmations
- Contracts
- Quotes/proposals

---

## Naming Convention

**Client Folder:**
```
[CompanyName] (no spaces, PascalCase)
```
Example: `AcmeConsulting`, `GrowthCoaching`

**Files:**
```
[CLIENT]_[TYPE]_[DESCRIPTION]_[DATE].[ext]
```
Example: `AcmeConsulting_Workflow_SalesProcess_2026-04-25.json`

---

## Quick Setup Commands

```bash
# Create new client folder structure
mkdir -p "client-work/[CLIENT-NAME]"/{brand-assets,discovery,workflow-designs,implementation,documentation,communication,billing}
```

---

*Template for Effortless Onboarding client management*
