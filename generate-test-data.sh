#!/bin/bash

echo "🚀 WPDash Test Data Generator"
echo "============================="
echo "This script generates comprehensive test data for the dashboard"
echo ""

# Configuration - UPDATE THESE VALUES
API_URL="https://YOUR_PROJECT_ID.supabase.co/functions/v1/ingest-event-v2"
AUTH_TOKEN="YOUR_SUPABASE_ANON_KEY"
SECRET="YOUR_INGEST_SECRET"

# Test Configuration
TOTAL_EVENTS=100
BATCH_SIZE=10
DELAY_BETWEEN_REQUESTS=0.1

# Check if credentials are configured
if [[ "$API_URL" == *"YOUR_PROJECT_ID"* ]]; then
    echo "❌ Error: Please update the API_URL with your Supabase project URL"
    exit 1
fi

# Statistics
SUCCESS_COUNT=0
FAILURE_COUNT=0
START_TIME=$(date +%s)

# Test Data Arrays
BUTTON_NAMES=(
  "Book Free Consultation"
  "Contact Us Now"
  "Get Quote"
  "Start Now"
  "Chat with Expert"
  "احجز استشارة مجانية"
  "تواصل معنا"
  "اطلب عرض سعر"
  "ابدأ الآن"
  "تحدث مع خبير"
)

WHATSAPP_NUMBERS=(
  "966501234567"
  "966502345678"
  "971501234567"
  "965501234567"
  "974501234567"
)

PAGES=(
  "https://example.com/services"
  "https://example.com/contact"
  "https://example.com/pricing"
  "https://example.com/about"
  "https://example.com/"
)

# Country IPs for testing
declare -A COUNTRY_IPS=(
  ["SA"]="5.188.84.0"      # Saudi Arabia
  ["AE"]="5.195.224.0"     # UAE
  ["KW"]="37.231.120.0"    # Kuwait
  ["QA"]="37.186.0.0"      # Qatar
  ["BH"]="37.131.0.0"      # Bahrain
  ["OM"]="5.36.0.0"        # Oman
  ["US"]="8.8.8.8"         # United States
  ["GB"]="81.92.204.0"     # United Kingdom
)

# User Agents
USER_AGENTS=(
  # Mobile (60%)
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
  # Desktop (30%)
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  # Tablet (10%)
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
)

# UTM Sources
UTM_SOURCES=("google" "facebook" "instagram" "twitter" "linkedin" "direct" "")
UTM_MEDIUMS=("cpc" "social" "email" "referral" "organic" "")
UTM_CAMPAIGNS=("summer_2025" "brand_awareness" "product_launch" "holiday_sale" "")

# Function to generate random timestamp within last 7 days
generate_timestamp() {
  local days_ago=$((RANDOM % 7))
  local hours_ago=$((RANDOM % 24))
  local mins_ago=$((RANDOM % 60))
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    date -u -v-${days_ago}d -v-${hours_ago}H -v-${mins_ago}M '+%Y-%m-%dT%H:%M:%S+00:00'
  else
    # Linux
    date -u -d "${days_ago} days ago ${hours_ago} hours ago ${mins_ago} minutes ago" '+%Y-%m-%dT%H:%M:%S+00:00'
  fi
}

# Function to send a single event
send_event() {
  local button_name="${BUTTON_NAMES[$RANDOM % ${#BUTTON_NAMES[@]}]}"
  local whatsapp_number="${WHATSAPP_NUMBERS[$RANDOM % ${#WHATSAPP_NUMBERS[@]}]}"
  local page="${PAGES[$RANDOM % ${#PAGES[@]}]}"
  local user_agent="${USER_AGENTS[$RANDOM % ${#USER_AGENTS[@]}]}"
  local timestamp=$(generate_timestamp)
  local event_id=$(uuidgen | tr '[:upper:]' '[:lower:]' 2>/dev/null || echo "test-$(date +%s)-$RANDOM")
  
  # Get random country and IP
  local countries=("SA" "AE" "KW" "QA" "BH" "OM" "US" "GB")
  local country="${countries[$RANDOM % ${#countries[@]}]}"
  local client_ip="${COUNTRY_IPS[$country]}"
  
  # Generate UTM parameters (50% chance)
  local utm_json=""
  if [ $((RANDOM % 2)) -eq 0 ]; then
    local utm_source="${UTM_SOURCES[$RANDOM % ${#UTM_SOURCES[@]}]}"
    local utm_medium="${UTM_MEDIUMS[$RANDOM % ${#UTM_MEDIUMS[@]}]}"
    local utm_campaign="${UTM_CAMPAIGNS[$RANDOM % ${#UTM_CAMPAIGNS[@]}]}"
    
    if [ -n "$utm_source" ]; then
      utm_json='"utm_params": {
        "utm_source": "'$utm_source'",
        "utm_medium": "'$utm_medium'",
        "utm_campaign": "'$utm_campaign'"
      },'
    fi
  fi
  
  # Create JSON payload
  local json_payload=$(cat <<EOF
{
  "button_name": "$button_name",
  "whatsapp_number": "$whatsapp_number",
  "gtm_unique_event_id": "$event_id",
  "source": "website",
  "page": "$page",
  "action": "whatsapp_click",
  "client_timestamp": "$timestamp",
  "server_enrichment": {
    "client_ip": "$client_ip",
    "user_agent_raw": "$user_agent",
    "server_timestamp": "$timestamp"
  },
  $utm_json
  "ua_data": {
    "userAgent": "$user_agent",
    "language": "ar-SA",
    "screen": { "width": 1920, "height": 1080 }
  }
}
EOF
)
  
  # Remove empty UTM section if not used
  if [ -z "$utm_json" ]; then
    json_payload=$(echo "$json_payload" | sed '/^[[:space:]]*$/d')
  fi
  
  # Send request
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "X-Ingest-Secret: $SECRET" \
    -d "$json_payload" 2>/dev/null)
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "202" ]; then
    ((SUCCESS_COUNT++))
    echo -n "✓"
  else
    ((FAILURE_COUNT++))
    echo -n "✗"
    echo -e "\n❌ Failed: HTTP $http_code - $body"
  fi
}

# Main execution
echo "Generating $TOTAL_EVENTS test events..."
echo "Progress:"

for ((i=1; i<=TOTAL_EVENTS; i++)); do
  send_event
  
  # Progress indicator
  if [ $((i % 50)) -eq 0 ]; then
    echo " [$i/$TOTAL_EVENTS]"
  fi
  
  # Small delay to avoid rate limiting
  sleep $DELAY_BETWEEN_REQUESTS
  
  # Longer delay between batches
  if [ $((i % BATCH_SIZE)) -eq 0 ]; then
    sleep $DELAY_BETWEEN_BATCHES
  fi
done

echo ""
echo ""

# Calculate statistics
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "✅ Test Data Generation Complete!"
echo "================================"
echo "Total Events: $TOTAL_EVENTS"
echo "Successful: $SUCCESS_COUNT"
echo "Failed: $FAILURE_COUNT"
echo "Duration: ${DURATION}s"
echo "Rate: $(echo "scale=2; $SUCCESS_COUNT / $DURATION" | bc) events/second"
echo ""
echo "Check your dashboard to see the test data!"