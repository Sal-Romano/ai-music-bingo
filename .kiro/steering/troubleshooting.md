# AI Music Bingo - Troubleshooting Guide

## Common Issues & Solutions

### Spotify Integration Issues

#### "No Spotify Devices Found"
**Symptoms**: Device list is empty, cannot start playback
**Solutions**:
1. Open Spotify app on target device and play any song briefly
2. Refresh device list in the app
3. Ensure Spotify Premium account is active
4. Check network connectivity between devices

#### "Playback Failed" Error
**Symptoms**: Music doesn't start, error in console
**Solutions**:
1. Verify Spotify Premium subscription is active
2. Check if selected device is still available
3. Ensure device has sufficient storage/memory
4. Try transferring playback manually in Spotify app first

#### Token Expired Issues
**Symptoms**: API calls fail with 401 errors
**Solutions**:
1. Check token expiration in database
2. Implement automatic token refresh
3. Clear stored tokens and re-authenticate
4. Verify refresh token is still valid

### Mobile App Issues

#### OAuth Flow Not Working
**Symptoms**: Browser opens but doesn't return to app
**Solutions**:
1. Check redirect URI configuration in Spotify dashboard
2. Verify state parameter is being passed correctly
3. Ensure WebBrowser.maybeCompleteAuthSession() is called
4. Test with different browsers (Safari, Chrome)

#### App Crashes on Startup
**Symptoms**: App closes immediately after opening
**Solutions**:
1. Check Expo logs for error details
2. Verify all required dependencies are installed
3. Clear Expo cache: `expo start --clear`
4. Rebuild the app with `eas build`

#### Bingo Card Not Loading
**Symptoms**: Stuck on loading screen, no bingo card appears
**Solutions**:
1. Check network connectivity
2. Verify Supabase connection and credentials
3. Check if Spotify tokens are valid
4. Fall back to demo card if API fails

### Database Issues

#### RLS Policy Errors
**Symptoms**: "Row Level Security" errors in console
**Solutions**:
1. Verify user is authenticated before database calls
2. Check RLS policies are correctly configured
3. Ensure user_id matches authenticated user
4. Test policies in Supabase SQL editor

#### Connection Timeouts
**Symptoms**: Database queries hang or timeout
**Solutions**:
1. Check network connectivity
2. Verify Supabase project is active
3. Monitor database performance in Supabase dashboard
4. Optimize slow queries with proper indexes

### Web App Issues

#### Build Failures
**Symptoms**: Next.js build fails in production
**Solutions**:
1. Check for TypeScript errors: `npm run type-check`
2. Verify all environment variables are set
3. Clear Next.js cache: `rm -rf .next`
4. Check for missing dependencies

#### API Route Errors
**Symptoms**: 500 errors from API endpoints
**Solutions**:
1. Check server logs in Vercel dashboard
2. Verify environment variables in production
3. Test API routes locally first
4. Ensure proper error handling in API routes

## Performance Issues

### Slow Bingo Card Generation
**Symptoms**: Long loading times when generating cards
**Solutions**:
1. Implement caching for Spotify track searches
2. Reduce number of API calls by batching requests
3. Use background processing for card generation
4. Add loading indicators for better UX

### High Memory Usage
**Symptoms**: App becomes sluggish, crashes on older devices
**Solutions**:
1. Optimize image loading and caching
2. Implement proper cleanup in useEffect hooks
3. Use React.memo for expensive components
4. Profile memory usage with React DevTools

### Network Request Failures
**Symptoms**: Intermittent API failures, timeout errors
**Solutions**:
1. Implement retry logic with exponential backoff
2. Add proper error boundaries
3. Cache responses when possible
4. Provide offline fallback functionality

## Development Environment Issues

### Expo Development Issues
**Symptoms**: Hot reload not working, metro bundler errors
**Solutions**:
1. Restart Expo development server
2. Clear Metro cache: `npx expo start --clear`
3. Check for conflicting ports
4. Update Expo CLI to latest version

### TypeScript Errors
**Symptoms**: Type checking failures, build errors
**Solutions**:
1. Update TypeScript definitions: `npm update @types/*`
2. Check for missing type declarations
3. Use proper type assertions instead of `any`
4. Generate fresh Supabase types

### Environment Variable Issues
**Symptoms**: Undefined environment variables, config errors
**Solutions**:
1. Verify .env file exists and is properly formatted
2. Check variable names match exactly (case-sensitive)
3. Restart development server after changes
4. Use EXPO_PUBLIC_ prefix for client-side variables

## Debugging Tools & Commands

### Useful Commands
```bash
# Check Expo logs
npx expo logs

# Clear all caches
npx expo start --clear
rm -rf node_modules && npm install

# Type check
npm run type-check

# Database migrations
supabase db reset
supabase db push

# Generate fresh types
supabase gen types typescript --local > types/supabase.ts
```

### Debugging Checklist
- [ ] Check console logs for errors
- [ ] Verify network requests in browser dev tools
- [ ] Test with different user accounts
- [ ] Check database records in Supabase dashboard
- [ ] Verify environment variables are loaded
- [ ] Test on different devices/browsers
- [ ] Check Spotify API quota usage

### Getting Help
1. Check Expo documentation and community forums
2. Review Supabase docs and Discord community
3. Consult Spotify Web API documentation
4. Search GitHub issues for similar problems
5. Create minimal reproduction case for bug reports