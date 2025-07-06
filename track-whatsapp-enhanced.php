<?php
// File: track-whatsapp-enhanced.php
// Purpose: Enhanced WhatsApp tracking proxy with Client Hints support
// Version: 2.0

// Load environment variables (if using .env file)
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Configuration
$config = [
    'supabase_url' => $_ENV['SUPABASE_URL'] ?? 'https://YOUR_PROJECT_ID.supabase.co',
    'supabase_anon_key' => $_ENV['SUPABASE_ANON_KEY'] ?? 'YOUR_ANON_KEY',
    'ingest_secret' => $_ENV['INGEST_SECRET'] ?? 'YOUR_SECRET',
    'allowed_origins' => explode(',', $_ENV['ALLOWED_ORIGINS'] ?? 'https://yourdomain.com'),
    'rate_limit' => [
        'requests_per_minute' => 100,
        'burst_size' => 10
    ]
];

// Enable Client Hints collection
header('Accept-CH: Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Model, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Arch, Sec-CH-UA-Bitness');
header('Vary: Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform');
header('Permissions-Policy: ch-ua=(self), ch-ua-mobile=(self), ch-ua-platform=(self), ch-ua-platform-version=(self), ch-ua-model=(self)');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $config['allowed_origins']) || in_array('*', $config['allowed_origins'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: ' . $config['allowed_origins'][0]);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept-CH');
header('Content-Type: application/json');

// Handle OPTIONS for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'details' => 'Only POST requests are accepted']);
    exit();
}

// Simple rate limiting
session_start();
$sessionKey = 'rate_limit_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$now = time();
$requests = $_SESSION[$sessionKey] ?? [];
$requests = array_filter($requests, function($timestamp) use ($now) {
    return ($now - $timestamp) < 60; // Keep only requests from last minute
});

if (count($requests) >= $config['rate_limit']['requests_per_minute']) {
    http_response_code(429);
    echo json_encode([
        'error' => 'Rate limit exceeded',
        'retry_after' => 60
    ]);
    exit();
}

$requests[] = $now;
$_SESSION[$sessionKey] = $requests;

// Error reporting for production
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    // Get input
    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception('No input received');
    }
    
    // Parse JSON
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }
    
    // Validate required fields
    $required = ['button_name', 'whatsapp_number', 'gtm_unique_event_id', 'source', 'page', 'action', 'client_timestamp'];
    $missing = [];
    
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        throw new Exception('Missing required fields: ' . implode(', ', $missing));
    }
    
    // Enrich payload with server-side data
    $data['server_enrichment'] = [
        // Client IP (handle various proxy headers)
        'client_ip' => $_SERVER['HTTP_CF_CONNECTING_IP'] ?? // Cloudflare
                      $_SERVER['HTTP_X_REAL_IP'] ?? // Nginx proxy
                      $_SERVER['HTTP_X_FORWARDED_FOR'] ?? // Standard proxy
                      $_SERVER['REMOTE_ADDR'] ?? null,
        
        // User Agent from request header
        'user_agent_raw' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        
        // Client Hints headers
        'client_hints' => [
            'ua' => $_SERVER['HTTP_SEC_CH_UA'] ?? null,
            'mobile' => $_SERVER['HTTP_SEC_CH_UA_MOBILE'] ?? null,
            'platform' => $_SERVER['HTTP_SEC_CH_UA_PLATFORM'] ?? null,
            'platform_version' => $_SERVER['HTTP_SEC_CH_UA_PLATFORM_VERSION'] ?? null,
            'model' => $_SERVER['HTTP_SEC_CH_UA_MODEL'] ?? null,
            'full_version_list' => $_SERVER['HTTP_SEC_CH_UA_FULL_VERSION_LIST'] ?? null,
            'arch' => $_SERVER['HTTP_SEC_CH_UA_ARCH'] ?? null,
            'bitness' => $_SERVER['HTTP_SEC_CH_UA_BITNESS'] ?? null
        ],
        
        // Referrer
        'referer' => $_SERVER['HTTP_REFERER'] ?? null,
        
        // Accept Language
        'accept_language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? null,
        
        // Additional headers that might be useful
        'dnt' => $_SERVER['HTTP_DNT'] ?? null,
        'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
        
        // Server timestamp for comparison
        'server_timestamp' => gmdate('Y-m-d\TH:i:s\Z')
    ];
    
    // Remove null client hints to save space
    $data['server_enrichment']['client_hints'] = array_filter(
        $data['server_enrichment']['client_hints'],
        function($value) { return $value !== null; }
    );
    
    // If no client hints were collected, remove the empty array
    if (empty($data['server_enrichment']['client_hints'])) {
        unset($data['server_enrichment']['client_hints']);
    }
    
    // Build Supabase Edge Function URL
    $supabaseUrl = rtrim($config['supabase_url'], '/') . '/functions/v1/ingest-event-v2';
    
    // Initialize cURL
    $ch = curl_init();
    if (!$ch) {
        throw new Exception('Failed to initialize cURL');
    }
    
    // Set cURL options
    curl_setopt_array($ch, [
        CURLOPT_URL => $supabaseUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'apikey: ' . $config['supabase_anon_key'],
            'Authorization: Bearer ' . $config['supabase_anon_key'],
            'X-Ingest-Secret: ' . $config['ingest_secret']
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => 'WhatsApp-Tracker-Enhanced/2.0'
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    // Check for cURL errors
    if ($curlError) {
        throw new Exception('Network error: ' . $curlError);
    }
    
    if ($response === false) {
        throw new Exception('No response received from server');
    }
    
    // Log successful requests (optional - for debugging)
    if ($httpCode === 200 || $httpCode === 201 || $httpCode === 202) {
        error_log(sprintf(
            '[WhatsApp Tracking] Success - Number: %s, Button: %s, ID: %s',
            $data['whatsapp_number'],
            $data['button_name'],
            $data['gtm_unique_event_id']
        ));
    }
    
    // Pass through the response
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    // Log the error
    error_log('[WhatsApp Tracking Error] ' . $e->getMessage());
    
    // Return user-friendly error
    http_response_code(500);
    echo json_encode([
        'error' => 'Tracking error',
        'message' => 'Failed to record click event',
        'details' => (ini_get('display_errors') ? $e->getMessage() : null),
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
    ]);
}
?>