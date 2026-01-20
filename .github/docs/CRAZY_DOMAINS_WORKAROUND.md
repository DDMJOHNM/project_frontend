# Crazy Domains DNS Issue - Workaround Options

## The Problem

Crazy Domains automatically appends `.duskaotearoa.co.nz` to CNAME values, making it impossible to point to CloudFront correctly:

❌ You enter: `d25wety08wrwk0.cloudfront.net`  
❌ It becomes: `d25wety08wrwk0.cloudfront.net.duskaotearoa.co.nz`

## Solutions (Choose One)

### Option 1: Migrate to AWS Route 53 (Recommended) ⭐

**Pros:**
- Full control over DNS
- Works perfectly with AWS services
- No more domain appending issues
- Professional DNS management

**Cons:**
- Requires updating nameservers at Crazy Domains
- Takes 1-6 hours for nameserver propagation

**Steps:**
1. Refresh AWS credentials: `aws sso login`
2. Run the migration script: `./migrate-to-route53.sh`
3. Update nameservers at Crazy Domains (script will show you the values)
4. Wait 1-6 hours for DNS propagation
5. Your site will work!

**Cost:** $0.50/month for hosted zone

---

### Option 2: Contact Crazy Domains Support

Call or chat with Crazy Domains support and say:

> "I need to create a CNAME record for www.duskaotearoa.co.nz pointing to d25wety08wrwk0.cloudfront.net, but your system keeps appending my domain name to the end. Can you either:
> 1. Create this CNAME record correctly for me, OR
> 2. Tell me how to prevent the domain from being appended"

They may be able to:
- Create the record for you manually
- Show you a hidden option/checkbox
- Use their internal tools to fix it

---

### Option 3: Use CloudFront Direct URL (Temporary)

While you sort out DNS, you can access your site directly via CloudFront:

**URL:** https://d25wety08wrwk0.cloudfront.net

This works immediately once you deploy files to S3. You can:
1. Deploy your site to S3
2. Test it at the CloudFront URL
3. Fix DNS later

---

### Option 4: Try Different DNS Record Formats

Some users have reported these workarounds with Crazy Domains:

**Try 1: Use the "Advanced" or "Expert" mode**
- Look for an "Advanced DNS" or "Expert Mode" option
- This might give you more control

**Try 2: Enter without the subdomain part**
- In the CNAME value field, try entering just: `d25wety08wrwk0.cloudfront.net`
- Look for a checkbox that says "This is an external domain" or similar

**Try 3: Check for ALIAS or ANAME record types**
- Instead of CNAME, look for "ALIAS" or "ANAME" record type
- These are modern alternatives that work at the root domain

---

## Recommendation

🎯 **I strongly recommend Option 1 (Route 53)**

Here's why:
- One-time setup, permanent solution
- No more fighting with Crazy Domains interface
- Works perfectly with CloudFront
- Industry standard for AWS deployments
- Costs less than $1/month

## Ready to Migrate?

```bash
# 1. Refresh credentials
aws sso login

# 2. Run migration
cd /Users/johnmason/dev/WhatsTheScore
./migrate-to-route53.sh

# 3. Follow the instructions to update nameservers
```

After migration, you'll never have DNS issues again!

---

## Quick Deploy to Test CloudFront URL

While you decide on DNS:

```bash
# Refresh credentials
aws sso login

# Deploy your site
cd /Users/johnmason/dev/WhatsTheScore
./deploy-manual.sh

# Visit your site at:
# https://d25wety08wrwk0.cloudfront.net
```

This lets you see your site working immediately, even before DNS is fixed!

