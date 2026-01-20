# Backend Configuration

This frontend connects to the backend API at: [https://github.com/DDMJOHNM/johns_ai_project_backend](https://github.com/DDMJOHNM/johns_ai_project_backend)

## Backend Deployment Options

Based on the backend repository, your backend can be deployed via:

1. **EC2 + Application Load Balancer** (Recommended for production)
   - URL format: `http://johns-ai-backend-ec2-alb-XXXXXX.us-east-1.elb.amazonaws.com`
   - Get this URL from your backend deployment output

2. **API Gateway** (If configured)
   - URL format: `https://XXXXXX.execute-api.us-east-1.amazonaws.com/prod`
   - Currently using: `https://beobftaez9.execute-api.us-west-2.amazonaws.com/prod`

## Configuration

### Environment Variables

Set the backend URL in your environment:

**For Local Development:**
Create a `.env.local` file:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
# Or your deployed backend URL
NEXT_PUBLIC_BACKEND_URL=http://johns-ai-backend-ec2-alb-XXXXXX.us-east-1.elb.amazonaws.com
```

**For Production (GitHub Actions):**
Add as GitHub Secret:
- `BACKEND_URL` - Your backend API URL (e.g., ALB DNS or API Gateway URL)

**For Static Export (S3/CloudFront):**
Since Next.js static export doesn't support server-side environment variables, you'll need to:
1. Use `NEXT_PUBLIC_BACKEND_URL` (client-side accessible)
2. Or proxy API calls through a serverless function

### Current Backend Endpoints

Based on the b`ackend repository, available endpoints include:

- `POST /login` - User authentication
- `GET /health` - Health check
- `GET /api/clients` - Get clients (requires authentication)
- Other endpoints as defined in the backend

## CORS Configuration

Your backend needs to allow requests from your frontend domain. Here's the complete CORS setup:

### Production CORS Settings

**Allowed Origins:**
- `https://duskaotearoa.co.nz` (primary domain)
- `https://www.duskaotearoa.co.nz` (if using www subdomain)

**Allowed Methods:**
- `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH`

**Allowed Headers:**
- `Content-Type`
- `Authorization`
- `X-Requested-With`
- `Accept`

**Credentials:**
- `Access-Control-Allow-Credentials: true` (if using cookies/auth tokens)

**Max Age:**
- `Access-Control-Max-Age: 86400` (24 hours for preflight cache)

### Local Development CORS Settings

**Allowed Origins:**
- `http://localhost:3000`
- `http://localhost:3001` (if using different port)

### Example Backend CORS Configuration

**For Express.js (Node.js):**
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://duskaotearoa.co.nz',
    'https://www.duskaotearoa.co.nz',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
```

**For Flask (Python):**
```python
from flask_cors import CORS

CORS(app, 
     origins=[
         'https://duskaotearoa.co.nz',
         'https://www.duskaotearoa.co.nz',
         *(['http://localhost:3000'] if os.getenv('FLASK_ENV') == 'development' else [])
     ],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
     supports_credentials=True,
     max_age=86400)
```

**For API Gateway (AWS):**
If using API Gateway, configure CORS in the API Gateway console or via CloudFormation/Terraform:
- Enable CORS on your API
- Add `https://duskaotearoa.co.nz` to allowed origins
- Configure allowed methods and headers as above

### Testing CORS

Test CORS configuration with:
```bash
# Test preflight request
curl -X OPTIONS https://your-backend-url/api/login \
  -H "Origin: https://duskaotearoa.co.nz" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return:
# Access-Control-Allow-Origin: https://duskaotearoa.co.nz
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
```

## HTTPS Requirements

Since your frontend is served via HTTPS (`https://duskaotearoa.co.nz`), your backend should also support HTTPS:

1. **If using EC2 + ALB:**
   - Add an SSL certificate to the ALB
   - Update ALB listener to use HTTPS (port 443)
   - Update backend URL to use `https://`

2. **If using API Gateway:**
   - API Gateway already provides HTTPS
   - Use the HTTPS API Gateway URL

## Testing Backend Connection

### Important: Frontend vs Backend URLs

- **Frontend URL**: `https://duskaotearoa.co.nz` (serves static files via CloudFront/S3)
- **Backend URL**: Your actual backend API (ALB, API Gateway, or EC2)
- **Frontend API Routes**: `https://duskaotearoa.co.nz/api/*` (Next.js API routes that proxy to backend)

### Testing the Backend Directly

1. **Find your backend URL** (see `FIND_BACKEND_URL.md`):
   - ALB: `http://johns-ai-backend-ec2-alb-XXXXXX.us-east-1.elb.amazonaws.com`
   - API Gateway: `https://beobftaez9.execute-api.us-west-2.amazonaws.com/prod`

2. **Health Check:**
   ```bash
   # Replace with your actual backend URL
   curl https://your-backend-url/health
   ```

3. **Login Test (Backend):**
   ```bash
   # Replace with your actual backend URL
   curl -X POST https://your-backend-url/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test@email.com","password":"test"}'
   ```

### Testing the Frontend API Route

The frontend has a Next.js API route at `/api/login` that proxies to the backend:

```bash
# Test frontend API route (proxies to backend)
curl -X POST https://duskaotearoa.co.nz/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"test"}'
```

**Note**: This requires:
- SSL certificate to be validated
- DNS to point to CloudFront
- Backend URL configured in environment variables

### SSL Certificate Issues

If you get SSL errors like:
```
curl: (60) SSL: no alternative certificate subject name matches target host name
```

**Possible causes:**
1. **Certificate not validated yet** - Check ACM certificate status in AWS Console
2. **DNS not pointing to CloudFront** - Verify DNS records
3. **Testing wrong domain** - Ensure you're using the correct domain

**To check certificate status:**
```bash
# Get CloudFront distribution ID from Terraform output
terraform output cloudfront_distribution_id

# Check certificate status
aws acm list-certificates --region us-east-1
aws acm describe-certificate --certificate-arn <arn> --region us-east-1
```

**To bypass SSL verification (testing only):**
```bash
curl -k -X POST https://duskaotearoa.co.nz/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"test"}'
```

⚠️ **Never use `-k` in production** - it disables SSL verification

## Deployment Workflow

1. **Deploy Backend First:**
   - Follow instructions in [backend repo](https://github.com/DDMJOHNM/johns_ai_project_backend)
   - Get the backend URL (ALB DNS or API Gateway URL)

2. **Configure Frontend:**
   - Add `BACKEND_URL` to GitHub Secrets
   - Or update `.env.local` for local development

3. **Deploy Frontend:**
   - Push to `main` branch
   - GitHub Actions will deploy to S3/CloudFront

4. **Verify Connection:**
   - Test login functionality
   - Check browser console for CORS errors
   - Verify API calls are successful

## Troubleshooting

### CORS Errors
- Verify backend CORS configuration includes your frontend domain
- Check that preflight OPTIONS requests are handled

### Connection Refused
- Verify backend is running and accessible
- Check security groups allow traffic from CloudFront
- Verify backend URL is correct

### HTTPS Mixed Content
- Ensure backend uses HTTPS if frontend uses HTTPS
- Update backend URL to use `https://` protocol

