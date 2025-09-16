import 'package:Hoga/core/constants/local_storage_tokens.dart';
import 'package:Hoga/core/services/local_storage_service.dart';

class OnboardingRepository {
  final LocalStorageService localStorageService;

  OnboardingRepository({required this.localStorageService});

  Future<bool> checkOnboardingStatus() async {
    final onboardingCompleted = await localStorageService.getToken(
      LocalStorageTokens.onboardingCompleted,
    );
    return onboardingCompleted != null && onboardingCompleted == 'true';
  }

  Future<void> completeOnboarding() async {
    await localStorageService.saveToken(
      LocalStorageTokens.onboardingCompleted,
      'true',
    );
  }

  Future<void> resetOnboarding() async {
    await localStorageService.deleteToken(
      LocalStorageTokens.onboardingCompleted,
    );
  }
}
