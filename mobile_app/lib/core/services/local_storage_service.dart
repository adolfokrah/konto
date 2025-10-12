import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  Future<void> saveToken(String token, String value) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(token, value);
  }

  Future<String?> getToken(String token) async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString(token);
  }

  Future<void> deleteToken(String token) async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(token);
  }

  /// Clear all data from local storage
  Future<void> clearAllData() async {
    final sp = await SharedPreferences.getInstance();
    await sp.clear();
  }
}
