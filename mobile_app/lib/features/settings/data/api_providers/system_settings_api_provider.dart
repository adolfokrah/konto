import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/settings/data/models/system_settings_model.dart';

class SystemSettingsApiProvider extends BaseApiProvider {
  SystemSettingsApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

  Future<SystemSettingsModel> getSystemSettings({String? country}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (country != null && country.isNotEmpty) {
        queryParams['country'] = country.toLowerCase();
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/system-settings',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return SystemSettingsModel.fromJson(response.data['data']);
      }
      return SystemSettingsModel.defaultSettings;
    } catch (e) {
      return SystemSettingsModel.defaultSettings;
    }
  }
}
