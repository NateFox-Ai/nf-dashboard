# Stripe Integration Plan — Effortless Onboarding

**Status:** Stripe account exists ✅ | **Next:** Wire into website

---

## Option 1: Stripe Pricing Table (Recommended — Easiest)

**What it is:** Stripe generates an embeddable pricing table widget. You copy-paste code into your site.

**Pros:**
- Zero code to maintain
- Stripe handles checkout, payments, receipts
- Built-in subscription management
- Mobile-responsive
- Updates in Stripe dashboard reflect on site instantly

**Cons:**
- Less customization than custom checkout
- Can't do complex post-payment flows natively

**How to set up:**

### Step 1: Create Products in Stripe Dashboard

1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Create 3 products:

| Product | Price | Type |
|---------|-------|------|
| Starter Build | $1,500 | One-time |
| Growth Build | $3,000 | One-time |
| Full System | $5,000 | One-time |

3. Also create a subscription product:

| Product | Price | Type |
|---------|-------|------|
| Maintenance & Support | $350/month | Recurring |

### Step 2: Create Pricing Table

1. In Stripe dashboard: **Products → Pricing tables → Create**
2. Select your products
3. Customize colors to match site (indigo/cyan theme)
4. Copy the embed code (looks like this):

```html
<script async src="https://js.stripe.com/v3/pricing-table.js"></script>
<stripe-pricing-table
  pricing-table-id="prctbl_xxxxxxxx"
  publishable-key="pk_live_xxxxxxxx"
>
</stripe-pricing-table>
```

### Step 3: Embed in Website

Replace the paid-path card in `index.html` with the pricing table embed.

**Post-payment redirect:**
- In Stripe dashboard, set "After payment" redirect to: `https://calendly.com/effortlessonboarding`
- This way: Pay → Auto-redirect to Calendly to book kickoff call

---

## Option 2: Stripe Payment Links (More Control)

**What it is:** Create individual payment links for each product, embed as buttons.

**Pros:**
- More control over presentation
- Can add custom post-payment logic
- Works with any site (even static HTML)

**Cons:**
- More manual setup per product
- No built-in pricing comparison table

**How to set up:**

1. In Stripe dashboard: **Payment Links → Create**
2. Create a link for each product
3. Copy each link
4. Embed as buttons on site:

```html
<a href="https://buy.stripe.com/xxxxx" class="btn btn-primary">
  Starter Build — $1,500
</a>
```

**Post-payment:**
- Set redirect URL to Calendly booking page
- Or create a custom "thank you" page with embedded Calendly

---

## Option 3: Custom Stripe Checkout (Most Control, Most Work)

**What it is:** Build your own checkout flow using Stripe.js

**Pros:**
- Full customization
- Can capture extra data during checkout
- Complex post-payment logic

**Cons:**
- Requires backend (or Stripe Checkout Sessions)
- More code to maintain
- Overkill for our current needs

**Verdict:** Not needed yet. Use Option 1 or 2.

---

## Recommended Flow (Option 1 + Calendly)

```
Visitor lands on site
    ↓
Sees two paths:
  ├─ Free Audit → Clicks → Calendly booking
  └─ Paid Plans → Clicks → Stripe Pricing Table
                              ↓
                        Chooses plan → Pays
                              ↓
                        Auto-redirect to Calendly
                              ↓
                        Books kickoff call
```

---

## What I Need From You (Kyle)

1. **Stripe publishable key** (starts with `pk_live_` or `pk_test_`)
2. **Pricing table embed code** (from Stripe dashboard)
3. **OR** Payment links for each product

Once you share those, I'll wire them into the site in ~5 minutes.

---

## Post-Payment Page (Optional Enhancement)

Instead of redirecting straight to Calendly, we could create a custom thank-you page:

```
https://effortlessonboarding.com/thank-you
```

This page would:
1. Say "Payment received! 🎉"
2. Show next steps
3. Embed Calendly directly
4. Track conversion with a simple pixel/event

**Worth doing?** Yes — gives us a branded experience + conversion tracking. I can build this in 10 minutes once Stripe is wired.

---

## Security Notes

- Never put Stripe **secret keys** in frontend code
- Publishable keys are safe to expose (they start with `pk_`)
- Use Stripe's built-in fraud protection
- Enable Stripe's email receipts for all payments
