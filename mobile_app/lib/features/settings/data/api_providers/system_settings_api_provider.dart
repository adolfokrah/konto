import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/settings/data/models/system_settings_model.dart';

/// API Provider for system settings operations
class SystemSettingsApiProvider extends BaseApiProvider {
  SystemSettingsApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

  /// Fetch system settings from backend
  /// Returns default settings if fetch fails
  Future<SystemSettingsModel> getSystemSettings() async {
    try {
      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/system-settings',
      );

      print('System Settings API Response: ${response.statusCode}');
      print('System Settings Data: ${response.data}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final settings = SystemSettingsModel.fromJson(response.data['data']);
        print('Parsed collectionFee: ${settings.collectionFee}');
        return settings;
      } else {
        print('API call failed or success != true, using default settings');
        // Return default settings if fetch fails
        return SystemSettingsModel.defaultSettings;
      }
    } catch (e) {
      print('Error fetching system settings: $e');
      // Return default settings on error
      return SystemSettingsModel.defaultSettings;
    }
  }
}
