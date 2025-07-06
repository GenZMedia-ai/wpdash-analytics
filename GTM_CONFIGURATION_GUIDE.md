# Google Tag Manager (GTM) Configuration Guide

This comprehensive guide will walk you through setting up WhatsApp click tracking in Google Tag Manager.

## Prerequisites
- Google Tag Manager container installed on your website
- Access to GTM with editing permissions
- PHP tracking endpoint deployed (see PHP_DEPLOYMENT_GUIDE.md)
- WhatsApp buttons on your website to track

## Overview
We'll create:
1. Variables to capture button information
2. A trigger for WhatsApp clicks
3. A tag to send data to your tracking endpoint

## Step 1: Create Variables

### 1.1 Create GTM Event ID Variable
This prevents duplicate tracking.

1. Go to Variables → User-Defined Variables → New
2. Name: "GTM Unique Event ID"
3. Variable Type: Custom JavaScript
4. Code:
```javascript
function() {
  return Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}
```
5. Save

### 1.2 Create Button Text Variable
1. Variables → New
2. Name: "WhatsApp Button Text"
3. Variable Type: Auto-Event Variable
4. Variable Type: Element Text
5. Save

### 1.3 Create WhatsApp Number Variable
1. Variables → New
2. Name: "WhatsApp Number"
3. Variable Type: Custom JavaScript
4. Code:
```javascript
function() {
  var clickedElement = {{Click Element}};
  var href = clickedElement.href || clickedElement.parentElement.href || '';
  var match = href.match(/wa\.me\/(\d+)/);
  return match ? match[1] : '';
}
```
5. Save

### 1.4 Create Timestamp Variable
1. Variables → New
2. Name: "ISO Timestamp"
3. Variable Type: Custom JavaScript
4. Code:
```javascript
function() {
  return new Date().toISOString();
}
```
5. Save

### 1.5 Enable Built-in Variables
Go to Variables → Configure and enable:
- Click Element
- Click Text
- Click URL
- Page URL
- Page Referrer
- User Agent
- Screen Resolution

## Step 2: Create the Trigger

### 2.1 WhatsApp Click Trigger
1. Go to Triggers → New
2. Name: "WhatsApp Button Click"
3. Trigger Type: Click - All Elements
4. This trigger fires on: Some Clicks
5. Conditions:
   - Click URL → contains → wa.me
   OR
   - Click Element → matches CSS selector → a[href*="wa.me"]
6. Save

### Alternative Trigger Options:

#### For Specific Buttons Only:
Add additional conditions:
- Click Text → contains → [specific button text]
- Click ID → equals → [specific button ID]

#### For Dynamic/JavaScript Buttons:
Use Click - All Elements with:
- Click Element → matches CSS selector → .whatsapp-button, [data-whatsapp], a[href*="wa.me"]

## Step 3: Create the Tag

### 3.1 HTTP Request Tag
1. Go to Tags → New
2. Name: "WhatsApp Click Tracking"
3. Tag Type: Custom HTML
4. HTML:
```html
<script>
(function() {
  // Prepare data
  var trackingData = {
    button_name: {{WhatsApp Button Text}} || {{Click Text}} || 'WhatsApp Button',
    whatsapp_number: {{WhatsApp Number}},
    gtm_unique_event_id: {{GTM Unique Event ID}},
    source: 'website',
    page: {{Page URL}},
    action: 'whatsapp_click',
    client_timestamp: {{ISO Timestamp}},
    ua_data: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    utm_params: {
      utm_source: {{URL - utm_source}},
      utm_medium: {{URL - utm_medium}},
      utm_campaign: {{URL - utm_campaign}},
      utm_term: {{URL - utm_term}},
      utm_content: {{URL - utm_content}}
    },
    page_context: {
      url: {{Page URL}},
      referrer: {{Page Referrer}},
      title: document.title
    }
  };

  // Send to your endpoint
  fetch('https://yourdomain.com/api/track-whatsapp-enhanced.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trackingData)
  })
  .then(function(response) {
    if (!response.ok) {
      console.error('Tracking failed:', response.status);
    }
  })
  .catch(function(error) {
    console.error('Tracking error:', error);
  });
})();
</script>
```

5. Replace `https://yourdomain.com/api/track-whatsapp-enhanced.php` with your actual endpoint
6. Triggering: Select "WhatsApp Button Click"
7. Save

### 3.2 Create UTM Variables (if not already existing)
For each UTM parameter, create a variable:

1. Variables → New
2. Name: "URL - utm_source" (repeat for medium, campaign, term, content)
3. Variable Type: URL
4. Component Type: Query
5. Query Key: utm_source (use respective parameter)
6. Save

## Step 4: Test Your Configuration

### 4.1 Preview Mode Testing
1. Click "Preview" in GTM
2. Enter your website URL
3. Navigate to a page with WhatsApp buttons
4. Click a WhatsApp button
5. In the Tag Assistant window, verify:
   - Trigger fired
   - Tag fired
   - Variables populated correctly

### 4.2 Check Network Tab
1. Open browser Developer Tools → Network tab
2. Filter by your domain
3. Click a WhatsApp button
4. Look for the POST request to your endpoint
5. Verify payload contains all expected data

### 4.3 Debug Common Issues

#### Tag Not Firing:
- Check trigger conditions
- Verify WhatsApp links format (should contain "wa.me")
- Check for JavaScript errors in console

#### Variables Not Populating:
- Ensure built-in variables are enabled
- Test variable values in Preview mode
- Check Custom JavaScript syntax

#### Network Errors:
- Verify endpoint URL is correct
- Check CORS settings on your server
- Ensure HTTPS is used

## Step 5: Advanced Configuration

### 5.1 Enhanced Error Handling
Add this to your Custom HTML tag:

```javascript
// After the fetch call
.then(function(response) {
  if (!response.ok) {
    // Send error to Google Analytics or your error tracking service
    dataLayer.push({
      'event': 'tracking_error',
      'error_type': 'whatsapp_tracking',
      'error_status': response.status
    });
  }
  return response.json();
})
.then(function(data) {
  // Success confirmation
  dataLayer.push({
    'event': 'whatsapp_tracked',
    'tracking_id': data.id
  });
})
```

### 5.2 Custom Button Attributes
For more control, add data attributes to your WhatsApp buttons:

```html
<a href="https://wa.me/966501234567" 
   data-button-name="Header CTA"
   data-campaign="summer_2025"
   data-position="top">
  Contact on WhatsApp
</a>
```

Then capture in GTM:
```javascript
var buttonName = {{Click Element}}.getAttribute('data-button-name') || {{Click Text}};
var campaign = {{Click Element}}.getAttribute('data-campaign');
var position = {{Click Element}}.getAttribute('data-position');
```

### 5.3 Consent Management
If using a consent management platform:

```javascript
// Add to beginning of tag
if (window.consentGranted !== true) {
  return; // Don't track if no consent
}
```

## Step 6: Publish and Monitor

### 6.1 Publishing
1. Review all changes in GTM
2. Add version name: "WhatsApp Tracking Implementation"
3. Add description of changes
4. Click "Publish"

### 6.2 Verify in Dashboard
1. Open your WPDash dashboard
2. Click some WhatsApp buttons on your site
3. Wait 60 seconds for data refresh
4. Verify events appear in dashboard

### 6.3 Set Up Monitoring
1. Create a GTM error tag for tracking failures
2. Set up alerts in your dashboard for anomalies
3. Regularly check data quality

## Troubleshooting Checklist

- [ ] GTM container is published
- [ ] Preview mode shows tag firing
- [ ] Network tab shows successful POST request
- [ ] PHP endpoint returns 200 status
- [ ] Dashboard shows new events
- [ ] No CORS errors in console
- [ ] Variables contain expected values

## Best Practices

1. **Naming Convention**: Use consistent naming for all GTM assets
2. **Documentation**: Add notes to all variables and tags
3. **Version Control**: Always add meaningful version descriptions
4. **Testing**: Test on multiple devices and browsers
5. **Monitoring**: Regularly check for tracking anomalies

## Support

If tracking isn't working:
1. Check browser console for errors
2. Verify in GTM Preview mode
3. Check PHP endpoint logs
4. Ensure Supabase Edge Function is running
5. Review this guide step by step

Remember to update the endpoint URL in the tag with your actual domain!