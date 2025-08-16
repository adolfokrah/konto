import 'package:konto/core/constants/local_storage_tokens.dart';
import 'package:konto/core/services/local_storage_service.dart';

/// Service for managing jar-related data in local storage
class JarStorageService {
  final LocalStorageService _localStorageService;

  JarStorageService({required LocalStorageService localStorageService})
    : _localStorageService = localStorageService;

  /// Save current jar ID to storage
  Future<bool> saveCurrentJarId(String jarId) async {
    try {
      print('💾 Saving current jar ID: $jarId');
      await _localStorageService.saveToken(
        LocalStorageTokens.currentJarId,
        jarId,
      );
      print('✅ Current jar ID saved to storage');
      return true;
    } catch (e) {
      print('💥 Error saving current jar ID: $e');
      return false;
    }
  }

  /// Get current jar ID from storage
  Future<String?> getCurrentJarId() async {
    try {
      final jarId = await _localStorageService.getToken(
        LocalStorageTokens.currentJarId,
      );
      print('🔍 Retrieved current jar ID: $jarId');
      return jarId;
    } catch (e) {
      print('💥 Error retrieving current jar ID: $e');
      return null;
    }
  }

  /// Clear current jar ID from storage
  Future<bool> clearCurrentJarId() async {
    try {
      await _localStorageService.deleteToken(LocalStorageTokens.currentJarId);
      print('🧹 Current jar ID cleared from storage');
      return true;
    } catch (e) {
      print('💥 Error clearing current jar ID: $e');
      return false;
    }
  }

  /// Check if a jar is currently selected
  Future<bool> hasCurrentJar() async {
    try {
      final jarId = await getCurrentJarId();
      return jarId != null && jarId.isNotEmpty;
    } catch (e) {
      print('💥 Error checking if jar is selected: $e');
      return false;
    }
  }

  /// Save recently viewed jar IDs (for history/favorites)
  Future<bool> addToRecentJars(String jarId) async {
    try {
      print('💾 Adding jar to recent jars: $jarId');

      // Get existing recent jars
      final recentJarsString = await _localStorageService.getToken(
        LocalStorageTokens.recentJars,
      );
      List<String> recentJars = [];

      if (recentJarsString != null && recentJarsString.isNotEmpty) {
        // Parse existing recent jars (assuming comma-separated string)
        recentJars = recentJarsString.split(',');
      }

      // Remove jar if it already exists (to move it to front)
      recentJars.remove(jarId);

      // Add to front
      recentJars.insert(0, jarId);

      // Keep only last 10 recent jars
      if (recentJars.length > 10) {
        recentJars = recentJars.take(10).toList();
      }

      // Save back to storage
      await _localStorageService.saveToken(
        LocalStorageTokens.recentJars,
        recentJars.join(','),
      );
      print('✅ Recent jars updated');
      return true;
    } catch (e) {
      print('💥 Error adding to recent jars: $e');
      return false;
    }
  }

  /// Get recently viewed jar IDs
  Future<List<String>> getRecentJars() async {
    try {
      final recentJarsString = await _localStorageService.getToken(
        LocalStorageTokens.recentJars,
      );
      if (recentJarsString != null && recentJarsString.isNotEmpty) {
        return recentJarsString.split(',');
      }
      return [];
    } catch (e) {
      print('💥 Error retrieving recent jars: $e');
      return [];
    }
  }

  /// Clear all jar-related storage data
  Future<bool> clearAllJarData() async {
    try {
      await clearCurrentJarId();
      await _localStorageService.deleteToken(LocalStorageTokens.recentJars);
      print('🧹 All jar storage data cleared');
      return true;
    } catch (e) {
      print('💥 Error clearing jar data: $e');
      return false;
    }
  }
}
