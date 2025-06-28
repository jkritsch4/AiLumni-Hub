# AiLumni-Hub Debugging Guide

## Overview

The AiLumni-Hub application now includes a comprehensive debugging system to help developers and users troubleshoot issues and understand application behavior.

## Features

### 1. Debug Logger (`/src/utils/debug.ts`)

The centralized logging system provides:

- **Error Tracking**: Automatic capture of errors with stack traces
- **Info Logging**: Detailed operation logging for debugging
- **Context Tracking**: Each log entry includes component and method information
- **Caching**: Stores last 50 errors and info logs for review
- **Export Functionality**: Download logs as JSON for sharing/analysis

### 2. Debug Console Component (`/src/components/DebugConsole.vue`)

An in-app debugging interface featuring:

- **Visual Error Display**: Real-time error notifications
- **Log Inspection**: Browse errors and info logs with filtering
- **Export Logs**: Download debugging data
- **Keyboard Shortcut**: `Ctrl+Shift+D` to toggle console
- **Auto-Show**: Automatically appears when errors occur in development

### 3. Component Integration

All major components now include comprehensive debugging:

#### API Service (`/src/services/api.ts`)
- Tracks all API calls and responses
- Logs cache hits/misses
- Error handling with fallback data
- Performance monitoring

#### Dashboard Component (`/src/components/Dashboard.vue`)
- Team data loading progress
- Theme changes tracking
- User preference updates

#### UpcomingGames Component (`/src/components/UpcomingGames.vue`)
- Game data fetching and filtering
- Display logic debugging

#### RecentResults Component (`/src/components/RecentResults.vue`)
- Game results processing
- Score calculation debugging

#### Standings Component (`/src/components/Standings.vue`)
- Conference filtering logic
- Team matching algorithm
- Sorting and ranking calculations

## Usage

### For Developers

1. **Automatic Logging**: All major operations are automatically logged
2. **Error Handling**: Errors are caught and logged with context
3. **Debug Mode**: Set `localStorage.setItem('ailumni-debug', 'true')` for verbose logging

### For Users

1. **Visual Indicators**: Debug toggle button appears when issues occur
2. **Easy Access**: Press `Ctrl+Shift+D` to open debug console
3. **Error Reporting**: Export logs to share with support team

### Debug Console Controls

- **Clear Logs**: Remove all current log entries
- **Export**: Download logs as JSON file for analysis
- **Tabs**: Switch between Errors and Info logs
- **Details**: Expand log entries to see stack traces and context data

## Code Examples

### Adding Debug Logging to a Function

```typescript
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

async function myFunction(param: string) {
  const context = createDebugContext('MyComponent', 'myFunction', { param });
  
  try {
    debug.info(context, 'Starting operation');
    
    // Your logic here
    const result = await someAsyncOperation(param);
    
    debug.info(context, 'Operation completed successfully', { result });
    return result;
  } catch (error) {
    handleComponentError(context, error);
    throw error; // or return fallback
  }
}
```

### Manual Error Logging

```typescript
debug.error(createDebugContext('Component', 'method'), new Error('Custom error message'));
```

### Warning Messages

```typescript
debug.warn(createDebugContext('Component', 'method'), 'Warning message', { additionalData });
```

## Performance Impact

- **Development**: Full logging enabled for debugging
- **Production**: Minimal overhead, errors only logged to console
- **Memory**: Logs are limited to last 50 entries per type
- **Storage**: Debug mode preference saved to localStorage

## Troubleshooting

### Common Issues

1. **Debug Console Not Appearing**
   - Check if errors are being generated
   - Verify keyboard shortcut (`Ctrl+Shift+D`)
   - Ensure DebugConsole component is imported in App.vue

2. **Missing Logs**
   - Verify debug imports in component files
   - Check if debug mode is enabled
   - Ensure context is properly created

3. **Performance Issues**
   - Disable debug mode in production
   - Clear logs regularly in long-running sessions

### Getting Help

1. **Export Logs**: Use the export function to save debugging data
2. **Share Context**: Include component and method information
3. **Browser Console**: Check browser dev tools for additional errors

## API Integration Debugging

The debugging system provides detailed insights into:

- **API Endpoint Calls**: Track all requests to AWS API
- **Data Transformation**: Monitor how raw API data is processed
- **Cache Performance**: See cache hits/misses and timing
- **Error Recovery**: Watch fallback mechanisms in action
- **Theme Changes**: Track dynamic theming updates

## Future Enhancements

- Remote logging for production environments
- Performance metrics collection
- User behavior analytics integration
- Automated error reporting
