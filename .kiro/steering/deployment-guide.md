# AI Music Bingo - Deployment Guide

## Web App Deployment (Vercel)

### Prerequisites
- Vercel account connected to GitHub repository
- Environment variables configured in Vercel dashboard
- Custom domain configured: `bingo.sals.site`

### Environment Variables
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### Deployment Steps
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set custom domain to `bingo.sals.site`
4. Enable automatic deployments on main branch push
5. Configure Spotify redirect URI to match domain

## Mobile App Deployment (EAS Build)

### Prerequisites
- Expo account and EAS CLI installed
- Apple Developer account ($99/year)
- iOS development certificate and provisioning profile

### EAS Configuration
Create `eas.json` in mobile app root:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands
```bash
# Development build
eas build --platform ios --profile development

# Production build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### App Store Configuration
- **Bundle ID**: `com.yourcompany.aimusicbingo`
- **App Name**: "AI Music Bingo"
- **Category**: Games > Music
- **Age Rating**: 4+ (no objectionable content)
- **Privacy Policy**: Required for Spotify integration

## Database Deployment (Supabase)

### Production Setup
1. Create production Supabase project
2. Run migration scripts in order
3. Configure RLS policies
4. Set up database backups
5. Monitor performance and usage

### Migration Commands
```bash
# Initialize Supabase locally
supabase init

# Link to remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## Monitoring & Analytics

### Error Tracking
- **Sentry**: For error monitoring and performance tracking
- **Vercel Analytics**: For web app performance metrics
- **Expo Analytics**: For mobile app usage tracking

### Performance Monitoring
- **Supabase Dashboard**: Database performance and usage
- **Spotify API Quotas**: Monitor rate limit usage
- **Vercel Functions**: API endpoint performance

### User Analytics
- **Privacy-First**: No personal data collection
- **Game Metrics**: Anonymous gameplay statistics
- **Performance Metrics**: App load times and responsiveness

## Security Considerations

### Production Checklist
- [ ] All environment variables secured
- [ ] HTTPS enforced on all endpoints
- [ ] Supabase RLS policies tested
- [ ] Spotify OAuth redirect URIs validated
- [ ] API rate limiting implemented
- [ ] Error messages don't expose sensitive data
- [ ] Database backups configured
- [ ] Security headers configured

### Regular Maintenance
- **Token Cleanup**: Remove expired Spotify tokens
- **Database Optimization**: Monitor and optimize queries
- **Dependency Updates**: Keep packages up to date
- **Security Patches**: Apply security updates promptly

## Rollback Procedures

### Web App Rollback
1. Revert to previous Vercel deployment
2. Check environment variables
3. Verify database compatibility
4. Test critical user flows

### Mobile App Rollback
1. Cannot rollback App Store releases
2. Prepare hotfix build if critical issues
3. Use feature flags for gradual rollouts
4. Maintain backward compatibility

### Database Rollback
1. Use Supabase point-in-time recovery
2. Test rollback in staging environment first
3. Coordinate with app deployments
4. Communicate downtime to users