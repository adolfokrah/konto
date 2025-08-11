# 🚨 Emergency Firebase Auth Checklist

## If Still Getting "Internal Server Error"

### **Firebase Console Verification:**

1. **Go to Firebase Console** → https://console.firebase.google.com
2. **Select project**: `konto-57286`
3. **Check these settings:**

#### **Authentication Setup:**
- Go to Authentication → Sign-in method
- ✅ Phone should be **ENABLED**
- ✅ Status should show "Enabled"

#### **Billing Verification:**
- Go to Usage and billing
- ✅ Plan should show "Blaze"
- ✅ Should NOT show "Spark"

#### **Phone Auth Settings:**
- Go to Authentication → Settings → Advanced
- ✅ Phone numbers for testing should be configured
- ✅ Add: `+1 650-555-3434` → `654321`

### **Quick Command to Check Project:**
```bash
firebase use konto-57286
firebase auth:export users.json --format=json
```

### **Alternative: Use Test Number First**
If real numbers still fail, confirm setup with:
```
Phone: +1 650-555-3434
Code: 654321
```

### **Emergency Reset (Last Resort):**
```bash
# Complete Firebase reset
flutter packages get
flutter clean
flutterfire configure
flutter run
```

## 🎯 Expected Behavior Now

### **✅ What Should Work:**
- Test numbers: Instant success
- Real Ghana numbers: Should work after config refresh
- No more "billing not enabled" errors
- Single verification screen (no duplicates)

### **🚨 If Still Failing:**
The issue might be:
1. Firebase project permissions
2. Regional restrictions (try different country code)
3. Network connectivity issues

But the config refresh should fix the "internal server error"! 🚀
