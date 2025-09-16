import 'package:dio/dio.dart';
import 'package:Hoga/core/services/local_storage_service.dart';
import 'package:Hoga/core/services/sms_otp_service.dart';
import 'package:Hoga/core/services/translation_service.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/core/services/jar_storage_service.dart';
import 'package:Hoga/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:Hoga/features/authentication/data/repositories/auth_repository.dart';
import 'package:Hoga/features/verification/data/api_providers/sms_api_provider.dart';
import 'package:Hoga/features/verification/data/repositories/verification_repository.dart';
import 'package:Hoga/features/onboarding/data/repositories/onboarding_repository.dart';
import 'package:Hoga/features/jars/data/api_providers/jar_api_provider.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';
import 'package:Hoga/features/media/data/api_provider/media_api_provider.dart';
import 'package:Hoga/features/media/data/repository_provider/media_repository.dart';
import 'package:Hoga/features/contribution/data/api_reproviders/contribution_api_provider.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/features/contribution/data/api_reproviders/momo_api_provider.dart';
import 'package:Hoga/features/contribution/data/repositories/momo_repository.dart';
import 'package:Hoga/features/user_account/data/api_providers/user_account_api_provider.dart';
import 'package:Hoga/features/user_account/data/repositories/user_account_repository.dart';

/// Service registry for dependency injection
/// Ensures all services are properly initialized with their dependencies
class ServiceRegistry {
  static final ServiceRegistry _instance = ServiceRegistry._internal();
  factory ServiceRegistry() => _instance;
  ServiceRegistry._internal();

  // Track initialization state
  bool _isInitialized = false;

  // Core services
  late final Dio _dio;
  late final LocalStorageService _localStorageService;
  late final SmsOtpService _smsOtpService;
  late final UserStorageService _userStorageService;
  late final JarStorageService _jarStorageService;
  late final TranslationService _translationService;

  // API providers
  late final SmsApiProvider _smsApiProvider;
  late final AuthApiProvider _authApiProvider;
  late final JarApiProvider _jarApiProvider;
  late final MediaApiProvider _mediaApiProvider;
  late final ContributionApiProvider _contributionApiProvider;
  late final MomoApiProvider _momoApiProvider;
  late final UserAccountApiProvider _userAccountApiProvider;

  // Repositories
  late final AuthRepository _authRepository;
  late final VerificationRepository _verificationRepository;
  // VerificationRepository? _overrideVerificationRepository; // test override
  late final OnboardingRepository _onboardingRepository;
  late final JarRepository _jarRepository;
  late final MediaRepository _mediaRepository;
  late final ContributionRepository _contributionRepository;
  late final MomoRepository _momoRepository;
  late final UserAccountRepository _userAccountRepository;

  /// Initialize all services with proper dependency injection
  void initialize() {
    // Skip if already initialized
    if (_isInitialized) {
      print('⚠️ ServiceRegistry already initialized, skipping...');
      return;
    }

    // Initialize Dio with configuration
    _dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      ),
    );

    // Initialize core services
    _localStorageService = LocalStorageService();
    _smsOtpService = SmsOtpService();
    _userStorageService = UserStorageService(
      localStorageService: _localStorageService,
    );
    _jarStorageService = JarStorageService(
      localStorageService: _localStorageService,
    );
    _translationService = TranslationService();
    _translationService.initialize();

    // Initialize API providers with Dio
    _smsApiProvider = SmsApiProvider(dio: _dio);
    _authApiProvider = AuthApiProvider(dio: _dio);
    _jarApiProvider = JarApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _mediaApiProvider = MediaApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _contributionApiProvider = ContributionApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _momoApiProvider = MomoApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _userAccountApiProvider = UserAccountApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );

    // Initialize repositories with dependencies
    _authRepository = AuthRepository(
      smsOtpService: _smsOtpService,
      authApiProvider: _authApiProvider,
      userStorageService: _userStorageService,
    );

    _verificationRepository = VerificationRepository(
      smsOtpService: _smsOtpService,
      smsApiProvider: _smsApiProvider,
    );

    _onboardingRepository = OnboardingRepository(
      localStorageService: _localStorageService,
    );

    _jarRepository = JarRepository(jarApiProvider: _jarApiProvider);

    _mediaRepository = MediaRepository(mediaApiProvider: _mediaApiProvider);

    _contributionRepository = ContributionRepository(
      contributionApiProvider: _contributionApiProvider,
    );
    _momoRepository = MomoRepository(momoApiProvider: _momoApiProvider);
    _userAccountRepository = UserAccountRepository(
      apiProvider: _userAccountApiProvider,
      userStorageService: _userStorageService,
    );

    _isInitialized = true;
    print('✅ ServiceRegistry initialized with Dio successfully');
  }

  // Getters for accessing initialized services
  Dio get dio => _dio;
  LocalStorageService get localStorageService => _localStorageService;
  SmsOtpService get smsOtpService => _smsOtpService;
  UserStorageService get userStorageService => _userStorageService;
  JarStorageService get jarStorageService => _jarStorageService;
  TranslationService get translationService => _translationService;
  SmsApiProvider get smsApiProvider => _smsApiProvider;
  AuthApiProvider get authApiProvider => _authApiProvider;
  JarApiProvider get jarApiProvider => _jarApiProvider;
  MediaApiProvider get mediaApiProvider => _mediaApiProvider;
  ContributionApiProvider get contributionApiProvider =>
      _contributionApiProvider;
  UserAccountApiProvider get userAccountApiProvider => _userAccountApiProvider;
  AuthRepository get authRepository => _authRepository;
  VerificationRepository get verificationRepository => _verificationRepository;
  OnboardingRepository get onboardingRepository => _onboardingRepository;
  JarRepository get jarRepository => _jarRepository;
  MediaRepository get mediaRepository => _mediaRepository;
  ContributionRepository get contributionRepository => _contributionRepository;
  UserAccountRepository get userAccountRepository => _userAccountRepository;
  MomoApiProvider get momoApiProvider => _momoApiProvider;
  MomoRepository get momoRepository => _momoRepository;

  /// Reset the registry (useful for testing)
  void reset() {
    _isInitialized = false;
    // _overrideVerificationRepository = null;
  }

  /// Initialize with custom Dio instance (useful for testing)
  void initializeWithDio(Dio customDio) {
    // Skip if already initialized
    if (_isInitialized) {
      reset();
    }

    // Use the provided Dio instance
    _dio = customDio;

    // Initialize core services
    _localStorageService = LocalStorageService();
    _smsOtpService = SmsOtpService();
    _userStorageService = UserStorageService(
      localStorageService: _localStorageService,
    );
    _jarStorageService = JarStorageService(
      localStorageService: _localStorageService,
    );
    _translationService = TranslationService();
    _translationService.initialize();

    // Initialize API providers with custom Dio
    _smsApiProvider = SmsApiProvider(dio: _dio);
    _authApiProvider = AuthApiProvider(dio: _dio);
    _jarApiProvider = JarApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _mediaApiProvider = MediaApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _contributionApiProvider = ContributionApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _momoApiProvider = MomoApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );
    _userAccountApiProvider = UserAccountApiProvider(
      dio: _dio,
      userStorageService: _userStorageService,
    );

    // Initialize repositories with dependencies
    _authRepository = AuthRepository(
      smsOtpService: _smsOtpService,
      authApiProvider: _authApiProvider,
      userStorageService: _userStorageService,
    );

    _verificationRepository = VerificationRepository(
      smsOtpService: _smsOtpService,
      smsApiProvider: _smsApiProvider,
    );

    _onboardingRepository = OnboardingRepository(
      localStorageService: _localStorageService,
    );

    _jarRepository = JarRepository(jarApiProvider: _jarApiProvider);

    _mediaRepository = MediaRepository(mediaApiProvider: _mediaApiProvider);

    _contributionRepository = ContributionRepository(
      contributionApiProvider: _contributionApiProvider,
    );
    _momoRepository = MomoRepository(momoApiProvider: _momoApiProvider);
    _userAccountRepository = UserAccountRepository(
      apiProvider: _userAccountApiProvider,
      userStorageService: _userStorageService,
    );

    _isInitialized = true;
    print('✅ ServiceRegistry initialized with custom Dio for testing');
  }

  // /// TEST ONLY: override the verification repository
  // void setVerificationRepositoryForTest(VerificationRepository repo) {
  //   _overrideVerificationRepository = repo;
  // }
}
