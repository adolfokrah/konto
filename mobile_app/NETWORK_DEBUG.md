# Network Debugging Guide for Konto SMS

## 🔧 Dio vs HTTP Package Benefits

### Why Dio is Better:
✅ **Better Error Handling**: Specific error types (timeout, connection, server errors)  
✅ **Interceptors**: Automatic logging and error handling  
✅ **Timeouts**: Configurable connection, send, and receive timeouts  
✅ **Retries**: Built-in retry mechanisms  
✅ **Request/Response Logging**: Detailed debugging information  

## 🐛 Common Network Issues & Solutions

### 1. **Connection Timeout**
```
DioExceptionType.connectionTimeout
```
**Cause**: Slow internet or server not responding  
**Solution**: Check internet connection, increase timeout in `HttpClientService`

### 2. **Certificate Errors**
```
DioExceptionType.badCertificate
```
**Cause**: SSL/TLS certificate issues  
**Solution**: Check if Mnotify API uses valid certificates

### 3. **Bad Response (4xx/5xx)**
```
DioExceptionType.badResponse
```
**Cause**: API key invalid, rate limiting, or server errors  
**Solution**: Verify API key in `sms_config.dart`, check Mnotify dashboard

### 4. **Connection Error**
```
DioExceptionType.connectionError
```
**Cause**: No internet connection  
**Solution**: Check device network connectivity

## 📱 Testing Your SMS Integration

### 1. **Check API Key**
```dart
// In lib/core/config/sms_config.dart
static const String mnotifyApiKey = 'A67zyKtxltxoH5iTDgz671wMD'; // ✅ Your key
```

### 2. **Test Phone Number Format**
```dart
// Should format as: +233XXXXXXXXX
print('Formatted: ${_smsOtpService.formatPhoneNumber("0244123456", "+233")}');
// Expected: +233244123456
```

### 3. **Check Logs**
When you tap Login, look for these logs:
```
🚀 Starting phone verification for: +233XXXXXXXXX
🌐 HTTP: [Request details]
📡 API Response received: {success: true/false, data: ...}
📋 Mnotify Data: {status: 'success', code: '2000', ...}
✅ SMS sent successfully to +233XXXXXXXXX
```

## 🔍 Debug Steps

### Step 1: Enable Detailed Logging
The `HttpClientService` now provides detailed logs for every request.

### Step 2: Test with Real Phone Number
```dart
// Try with your Ghana phone number
// Format: 0244123456 → +233244123456
```

### Step 3: Check Mnotify Dashboard
- Login to your Mnotify account
- Check SMS credits balance
- Verify sender ID approval status
- Review delivery reports

### Step 4: Test API Directly
You can test Mnotify API directly:
```bash
curl -X POST https://api.mnotify.com/api/sms/quick \
  -H "Authorization: Bearer A67zyKtxltxoH5iTDgz671wMD" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "recipient[]=+233XXXXXXXXX" \
  -d "sender=Konto" \
  -d "message=Test message" \
  -d "is_schedule=false"
```

## 🎯 Expected Success Response
```json
{
  "status": "success",
  "code": "2000",
  "message": "Message sent successfully",
  "data": {
    "id": "message_id_here"
  }
}
```

## ❌ Common Error Responses
```json
{
  "status": "error",
  "code": "4001",
  "message": "Invalid API key"
}
```

## 🚀 Next Steps
1. **Run the app** and check Flutter logs when tapping Login
2. **Look for network errors** in the console
3. **Test with your phone number** to verify SMS delivery
4. **Check Mnotify dashboard** for delivery status
